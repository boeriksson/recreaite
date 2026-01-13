import { defineBackend } from '@aws-amplify/backend';
import { storage } from './storage/resource';
import { uploadToS3 } from './functions/upload-to-s3/resource';
import { externalApi } from './functions/external-api/resource';

/**
 * Define the backend for your Amplify app
 */
const backend = defineBackend({
  storage,
  uploadToS3,
  externalApi,
});

// Grant the Lambda functions access to the S3 bucket
backend.uploadToS3.resources.lambda.addToRolePolicy(
  new backend.resources.aws.iam.PolicyStatement({
    effect: backend.resources.aws.iam.Effect.ALLOW,
    actions: ['s3:PutObject', 's3:GetObject'],
    resources: [`${backend.storage.resources.bucket.bucketArn}/*`],
  })
);
