import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import getSQSClient from '~/clients/sqs';
import {
  DeleteMessageBatchRequest,
  DeleteMessageBatchRequestEntry,
  ReceiveMessageRequest,
} from 'aws-sdk/clients/sqs';

const IGNORED_QUEUE_URL =
  'http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/requestQueue';

export const jobUpdatesRouter = createTRPCRouter({
  getRandomQueueUrl: publicProcedure.query(async () => {
    const sqs = getSQSClient();
    const listQueuesResponse = await sqs.listQueues().promise();

    const queueUrls = listQueuesResponse.QueueUrls?.filter(
      (url) => url !== IGNORED_QUEUE_URL
    );
    console.log(queueUrls);
    if (!queueUrls || queueUrls.length === 0) {
      console.log('No queues found.');
      return undefined;
    }

    const randomIndex = Math.floor(Math.random() * queueUrls.length);
    return queueUrls[randomIndex];
  }),
  getJobUpdates: publicProcedure
    .input(z.object({ queueUrl: z.string() }))
    .query(async ({ input }) => {
      const queueUrl = input.queueUrl;
      console.log('Selected queue: ', queueUrl);

      if (!queueUrl) {
        return [];
      }

      const receiveParameters = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 0,
      } as ReceiveMessageRequest;

      const sqs = getSQSClient();
      const messages = await sqs.receiveMessage(receiveParameters).promise();
      if (messages.Messages && messages.Messages.length !== 0) {
        console.log('From queue:', queueUrl);
        console.log('\t', messages);

        const deleteBatchParameters = {
          QueueUrl: queueUrl,
          Entries: messages.Messages.map((message) => ({
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle,
          })) as DeleteMessageBatchRequestEntry[],
        };

        await sqs.deleteMessageBatch(deleteBatchParameters).promise();
      }

      return messages.Messages;
    }),
});
