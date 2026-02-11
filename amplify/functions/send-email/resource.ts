import { defineFunction } from '@aws-amplify/backend';

export const sendEmailFunction = defineFunction({
  name: 'send-email-handler',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
  runtime: 20, // Node.js 20 includes AWS SDK v3
  environment: {
    SENDER_EMAIL: 'noreply@heylook.ai',
    APP_URL: 'https://heylook.ai',
  },
});
