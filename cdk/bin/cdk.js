#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { PipelineResourceStack } = require('../lib/pipeline-notif-cdk-stack');

const app = new cdk.App();

const accountDetails = { account: '', region: '' };

const pipelineResourceDevProps = {
  env: accountDetails,
  googleChatUrl: "https://chat.googleapis.com/v1/spaces/AAAAm518oXM/messages?key=",
  environmentType: "Dev",
  topicName: 'pipeline-notification'
  }

/************************************************ PIPELINE-NOTIFICATION-STACK ****************************************************/

const pipelineResourceDevStack = new PipelineResourceStack(app, 'PipelineResourceDevStack', pipelineResourceDevProps);
cdk.Tags.of(pipelineResourceDevStack).add(TagName.APP_NAME, 'PipelineResource');
cdk.Tags.of(pipelineResourceDevStack).add(TagName.ENVIRONMENT_TYPE, pipelineResourceDevProps.environmentType);