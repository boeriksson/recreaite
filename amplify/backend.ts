import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';
import { data } from './data/resource';
import { aiFunction } from './functions/ai/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * Define the backend for your Amplify app
 */
const backend = defineBackend({
  auth,
  storage,
  data,
  aiFunction,
});

// Get references to resources
const authenticatedRole = backend.auth.resources.authenticatedUserIamRole;
const unauthenticatedRole = backend.auth.resources.unauthenticatedUserIamRole;
const lambdaFunctionInterface = backend.aiFunction.resources.lambda;

// Grant authenticated users permission to invoke the AI Lambda function
authenticatedRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [lambdaFunctionInterface.functionArn],
  })
);

// Temporarily grant unauthenticated (guest) users permission to invoke Lambda for testing
unauthenticatedRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [lambdaFunctionInterface.functionArn],
  })
);

// Export the function name for client-side invocation
backend.addOutput({
  custom: {
    aiFunction: lambdaFunctionInterface.functionName,
  },
});
