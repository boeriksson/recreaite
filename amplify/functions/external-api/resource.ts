import { defineFunction } from '@aws-amplify/backend';

export const externalApi = defineFunction({
  name: 'externalApi',
  entry: './handler.ts'
});
