#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { PipelineStack } = require('../lib/pipeline-stack');

const app = new cdk.App();

/******************** Account Details ****************************/

const accountDetails = { account: '', region: 'ap-south-1' };


/******************** CODEBUILD-DEV-ENV-VARIABLES ********************/
const envVariables = {
  AWS_DEFAULT_REGION: { value: 'ap-south-1' },
  AWS_ACCOUNT_ID: { value: '' },
  ECR_REPO_NAME : { value: 'ecr-repo-name' },
  KMS_KEY_ID: { value: '' },
  IMAGE_TAG_ENVIRONMENT: { value: 'v.1' },
  ENC_FILE_PATH: { value: '/.env' }
}

/************************** DEV STACK PROPS ****************************/
const devProps = {
  env:accountDetails,
  environmentType: EnvironmentType.DEVELOPMENT,
  environmentId: EnvironmentId.SENTINEL_DEVELOPMENT,
  kmsKeyArn: '',
  gitBranch: 'develop',
  codeStarConnectionArn: '',
  envVariable: envVariables,
  ecsServiceName: '',
  ecsClusterName: '',
  ecsClusterArn: '',
  codeBuildLogGroupName: '',
  pipelineBucketArn: '',
  pipelineSnsArn: '',
  buildspecFileName:'scripts/codebuild/buildspec.yml'
}

const pipeline = new PipelineStack(app, 'PipelineStack', devProps);
