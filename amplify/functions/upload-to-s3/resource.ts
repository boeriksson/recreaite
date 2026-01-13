import { defineFunction } from '@aws-amplify/backend';

export const uploadToS3 = defineFunction({
  name: 'uploadToS3',
  entry: './handler.ts'
});
