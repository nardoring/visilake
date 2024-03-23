import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import getSQSClient from '~/clients/sqs';
import {
  CreateQueueRequest,
  DeleteMessageBatchRequestEntry,
  DeleteQueueRequest,
  GetQueueAttributesRequest,
  GetQueueUrlRequest,
  ReceiveMessageRequest,
} from 'aws-sdk/clients/sqs';

import { v4 as uuidv4 } from 'uuid';
import getSNSClient from '~/clients/sns';
import { SubscribeInput, SubscribeResponse } from 'aws-sdk/clients/sns';

const SNS_TOPIC_ARN =
  'arn:aws:sns:us-east-1:000000000000:requestUpdatesTopic.fifo';
const BASE_JOB_UPDATES_QUEUE_NAME = 'requestUpdates';

export const jobUpdatesRouter = createTRPCRouter({
  getQueueUrl: publicProcedure.query(async () => {
    const sqs = getSQSClient();
    const sns = getSNSClient();

    const queueName =
      BASE_JOB_UPDATES_QUEUE_NAME +
      '-' +
      uuidv4().toString().toLowerCase() +
      '.fifo';

    const newQueueParams = {
      QueueName: queueName,
      Attributes: {
        FifoQueue: 'true',
        MessageRetentionPeriod: '60',
        ContentBasedDeduplication: 'true',
      },
    } as CreateQueueRequest;

    await sqs.createQueue(newQueueParams).promise();

    const getQueueUrlParams = {
      QueueName: queueName,
    } as GetQueueUrlRequest;

    const queueResponse = await sqs.getQueueUrl(getQueueUrlParams).promise();

    const queueUrl = queueResponse.QueueUrl;
    console.log(queueUrl);
    if (!queueUrl || queueUrl.length === 0) {
      console.log('Queue not created. No queue url found');
      return undefined;
    }

    const getQueueAttributesParams = {
      QueueUrl: queueUrl,
      AttributeNames: ['QueueArn'],
    } as GetQueueAttributesRequest;

    const queueAttributes = await sqs
      .getQueueAttributes(getQueueAttributesParams)
      .promise();

    const topics = await sns.listTopics().promise();
    console.log(topics);

    const subscribeTopicParams = {
      Protocol: 'sqs',
      TopicArn: SNS_TOPIC_ARN,
      Endpoint: queueAttributes.Attributes?.QueueArn,
    } as SubscribeInput;

    await sns.subscribe(subscribeTopicParams).promise();

    return queueUrl;
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
