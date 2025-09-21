const { Stack, Duration } = require('aws-cdk-lib');
const iam = require('aws-cdk-lib/aws-iam')
const lambda = require('aws-cdk-lib/aws-lambda')
const logs = require('aws-cdk-lib/aws-logs')
const sns = require('aws-cdk-lib/aws-sns')
const sns_subscriptions = require('aws-cdk-lib/aws-sns-subscriptions')
const ssm = require('aws-cdk-lib/aws-ssm')
const path = require('path');


class PipelineResourceStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const {
      googleChatUrl,
      environmentType,
      topicName
    } = props

    const pipelineSnsTopic = new sns.Topic(this, 'PipelineSnsTopic', {
      topicName
    })

    const topicPolicy = new sns.TopicPolicy(this, 'TopicPolicy', {
      topics: [pipelineSnsTopic],
    });

    topicPolicy.document.addStatements(new iam.PolicyStatement({
      actions: ["sns:Publish"],
      principals: [new iam.ServicePrincipal('codestar-notifications.amazonaws.com')],
      resources: [pipelineSnsTopic.topicArn],
    }));



    const snsLambdaInvokePolicy = new iam.ManagedPolicy(this, 'SnsLambdaInvokePolicy', {
      managedPolicyName: 'SnsLambdaInvokePolicy',
      document: new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'lambda:invokeFunction'
          ],
          resources: [pipelineSnsTopic.topicArn]
        })]
      })
    })
    
    const lambdaLogPolicy = new iam.ManagedPolicy(this, 'lambdaLogPolicy', {
      managedPolicyName: 'PipelineNotifLambdaCloudWatchLogPolicy',
      document: new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          resources: ['*']
        }
        )]
      })
    })

    const pipelineNotificationLambdaRole = new iam.Role(this, 'PipelineNotificationLambdaRole', {
      roleName: 'PipelineNotificationLambdaRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      assumeRoleAction: 'sts:AssumeRole',
      path: '/',
      managedPolicies: [snsLambdaInvokePolicy, lambdaLogPolicy],
    })

    const pipelineChatNotificationLambdaFn = new lambda.Function(this, 'PipelineChatNotificationLambdaFn', {
      functionName: 'PipelineNotificationLambdaFn',
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/pipeline-notification')),
      timeout: Duration.minutes(1),
      role: pipelineNotificationLambdaRole,
      handler: 'index.handler',
      logRetention: logs.RetentionDays.THREE_DAYS,
      environment: { "API_URL": googleChatUrl, "environment": environmentType }
    })

    pipelineSnsTopic.addSubscription(new sns_subscriptions.LambdaSubscription(pipelineChatNotificationLambdaFn))

  }
}

module.exports = { PipelineResourceStack }
