import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';
import { data } from './data/resource';
import { aiFunction } from './functions/ai/resource';
import { sendEmailFunction } from './functions/send-email/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * Define the backend for your Amplify app
 */
const backend = defineBackend({
  auth,
  storage,
  data,
  aiFunction,
  sendEmailFunction,
});

// Get references to resources
const authenticatedRole = backend.auth.resources.authenticatedUserIamRole;
const unauthenticatedRole = backend.auth.resources.unauthenticatedUserIamRole;
const lambdaFunctionInterface = backend.aiFunction.resources.lambda;
const sendEmailLambda = backend.sendEmailFunction.resources.lambda;

// Grant authenticated users permission to invoke the AI Lambda function
authenticatedRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [lambdaFunctionInterface.functionArn],
  })
);

// Grant authenticated users permission to invoke the Send Email Lambda function
authenticatedRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [sendEmailLambda.functionArn],
  })
);

// Grant the Send Email Lambda permission to send emails via SES
sendEmailLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'], // You can restrict this to specific verified identities
  })
);

// Temporarily grant unauthenticated (guest) users permission to invoke Lambda for testing
unauthenticatedRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [lambdaFunctionInterface.functionArn],
  })
);

// Export the function names for client-side invocation
backend.addOutput({
  custom: {
    aiFunction: lambdaFunctionInterface.functionName,
    sendEmailFunction: sendEmailLambda.functionName,
  },
});
