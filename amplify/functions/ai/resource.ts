import { defineFunction, secret } from '@aws-amplify/backend';

export const aiFunction = defineFunction({
  name: 'ai-handler',
  entry: './handler.ts',
  timeoutSeconds: 120,
  memoryMB: 512,
  resourceGroupName: 'auth',  // Assign to auth stack to break circular dependency
  environment: {
    GEMINI_API_KEY: secret('GEMINI_API_KEY'),
  },
});
