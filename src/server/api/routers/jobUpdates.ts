import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import getSQSClient from '~/clients/sqs';
import {
  DeleteMessageBatchRequest,
  DeleteMessageBatchRequestEntry,
  ReceiveMessageRequest,
} from 'aws-sdk/clients/sqs';

const QUEUE_NAME = 'requestUpdatesQueue';

export const jobUpdatesRouter = createTRPCRouter({
  getJobUpdates: publicProcedure.query(async () => {
    const sqs = getSQSClient();

    const queueUrlResponse = await sqs
      .getQueueUrl({ QueueName: QUEUE_NAME })
      .promise();

    const recieveParameters = {
      QueueUrl: queueUrlResponse.QueueUrl,
      MaxNumberOfMessages: 10,
      VisibilityTimeout: 0,
    } as ReceiveMessageRequest;

    const messages = await sqs.receiveMessage(recieveParameters).promise();
    console.log(messages);
    if (messages.Messages && messages.Messages?.length != 0) {
      console.log(messages);

      const deleteBatchParameters = {
        QueueUrl: queueUrlResponse.QueueUrl,
        Entries: messages.Messages.map((message) => {
          return {
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle,
          } as DeleteMessageBatchRequestEntry;
        }),
      } as DeleteMessageBatchRequest;

      await sqs.deleteMessageBatch(deleteBatchParameters).promise();
    }

    return messages.Messages;
  }),
});
