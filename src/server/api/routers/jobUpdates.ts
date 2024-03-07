import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import getSQSClient from '~/clients/sqs';
import { ReceiveMessageRequest } from 'aws-sdk/clients/sqs';

const QUEUE_NAME = 'requestQueue';

export const jobUpdatesRouter = createTRPCRouter({
  getJobUpdates: publicProcedure
    .input(
      z.object({
        minimumTime: z.date(),
      })
    )
    .query(async (input) => {
      const sqs = getSQSClient();

      const queueUrlResponse = await sqs
        .getQueueUrl({ QueueName: QUEUE_NAME })
        .promise();

      const recieveParameters = {
        QueueUrl: queueUrlResponse.QueueUrl,
        MaxNumberOfMessages: 100,
        VisibilityTimeout: 0,
      } as ReceiveMessageRequest;

      const messages = sqs.receiveMessage(recieveParameters, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log(data);
        }
      });

      console.log(messages);
    }),

  deleteJobUpdate: publicProcedure
    .input(
      z.object({
        messageId: z.string(),
      })
    )
    .mutation(async (input) => {
      const sqs = getSQSClient();

      const queueUrlResponse = await sqs
        .getQueueUrl({ QueueName: QUEUE_NAME })
        .promise();
      const deleteMessageParameters = {
        QueueUrl: queueUrlResponse,
      };
    }),
});
