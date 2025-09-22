const { Stack, Duration, RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3')
const iam = require('aws-cdk-lib/aws-iam')
const codepipeline = require('aws-cdk-lib/aws-codepipeline')
const codebuild = require('aws-cdk-lib/aws-codebuild')
const codepipeline_actions = require('aws-cdk-lib/aws-codepipeline-actions')
const logs = require('aws-cdk-lib/aws-logs')
const ecs = require('aws-cdk-lib/aws-ecs')
const sns = require('aws-cdk-lib/aws-sns')
const codestarnotifications = require('aws-cdk-lib/aws-codestarnotifications')

class PipelineStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const {
      kmsKeyArn,
      gitBranch,
      codeStarConnectionArn,
      envVariable,
      ecsServiceName,
      ecsClusterName,
      ecsClusterArn,
      codeBuildLogGroupName,
      pipelineBucketArn,
      pipelineSnsArn,
      buildspecFileName
    } = props

    const pipelineBucket = s3.Bucket.fromBucketArn(this, 'PipelineBucket', `${pipelineBucketArn}`)

    // Codepipeline servie role
    const codePipelineRole = new iam.Role(this, 'CodePipelineRole', {
      roleName: 'CodePipelineRole',
      description: 'Policy used in trust relationship with CodePipeline',
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com')
    })

    // Policy needed for event bridge trigger
    codePipelineRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchEventsFullAccess"))

    //  Codebuild servie role
    const codebuildRole = new iam.Role(this, 'CodebuildRole', {
      roleName: 'CodebuildRole',
      description: 'Policy used in trust relationship with CodeBuild',
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com')
    });

    // Policy needed for building docker images and pushing the image to ECR
    codebuildRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryPowerUser"))

    // KMS inline policy for codebuild for decrypting ENV
    codebuildRole.attachInlinePolicy(
      new iam.Policy(this, 'codebuild-kms-decrypt', {
        policyName: 'codebuild-kms-decrypt',
        description: 'Policy for codebuild to give kms decrypt access',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['kms:Decrypt'], 
            resources: [kmsKeyArn]
          })
        ]
      })
    )

    // Source Artifact
    const sourceArtifact = new codepipeline.Artifact('SourceArtifact');

    //Source Stage
    const sourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
      actionName: 'Github',
      owner: '',
      repo: '',
      branch: gitBranch,
      output: sourceArtifact,
      connectionArn: codeStarConnectionArn,
      variablesNamespace: 'SourceVariables',
      triggerOnPush: false,
    })

    //Build Artifact
    const buildArtifact = new codepipeline.Artifact('BuildArtifact');

    // Build Project
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: 'docker-build',
      buildSpec: codebuild.BuildSpec.fromSourceFilename(buildspecFileName),
      timeout: Duration.minutes(60),
      environment: {
        computeType: codebuild.ComputeType.LARGE,
        buildImage: codebuild.LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
        privileged: true
      },
      environmentVariables: envVariable,
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'PipelineLogGroup', {
            logGroupName: codeBuildLogGroupName,
            retention: logs.RetentionDays.THREE_DAYS,
            removalPolicy: RemovalPolicy.DESTROY
          })
        }
      },
      role: codebuildRole
    })

    // Build Stage
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Docker-Build',
      project: buildProject,
      input: sourceArtifact,
      outputs: [buildArtifact]
    })

    // ECS Service
    const service = ecs.Ec2Service.fromEc2ServiceAttributes(this, 'EcsService', {
      serviceName: ecsServiceName,
      cluster: {
        clusterArn: ecsClusterArn,
        clusterName: ecsClusterName
      }
    })

    // Deploy Stage
    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'Deploy',
      input: buildArtifact,
      deploymentTimeout: Duration.minutes(60),
      service
    })

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: '',
      crossAccountKeys: false,
      role: codePipelineRole,
      artifactBucket: pipelineBucket,
      pipelineType: 'V2'
    })

    /*********************** Notification Setup**************************************/
    const topic = sns.Topic.fromTopicArn(this, 'pipelineSnsTopic', `${pipelineSnsArn}`)

    // Notification Rule
    new codestarnotifications.NotificationRule(this, 'NotificationRule', {
      source: pipeline,
      events: [
        'codepipeline-pipeline-action-execution-failed',
        'codepipeline-pipeline-stage-execution-failed',
        'codepipeline-pipeline-pipeline-execution-failed'
      ],
      notificationRuleName: 'pipeline-notification-rule',
      enabled: true,
      detailType: codestarnotifications.DetailType.FULL,
      targets: [topic]
    });

    /******************************************************************************/

    /**********************Adding diffrent stage to pipeline************************/

    //Source Stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction]
    })

    // Build Stage
    pipeline.addStage({
      stageName: 'Docker-Build',
      actions: [buildAction]
    })

    // Deploy Stage 
    pipeline.addStage({
        stageName: 'Deploy',
        actions: [deployAction]
      })

    /******************************************************************************/

  }
}

module.exports = { PipelineStack }
