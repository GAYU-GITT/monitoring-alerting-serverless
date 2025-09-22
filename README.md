## CI/CD with Automated Serverless Alerting
Developed an automated AWS CI/CD pipeline to build, test, and deploy Dockerized applications to ECS, with real-time notifications to Google Chat.

## Key Achievements
* Designed and deployed a **fully automated CI/CD pipeline** using **AWS CodePipeline, CodeBuild, and ECS (EC2 launch type)**.
* Implemented **automated Docker builds** and pushed images to **Amazon ECR**.
* Integrated **SNS-triggered Lambda notifications** to **Google Chat**, improving incident response time.
* Managed **IAM roles and KMS keys** to enforce **least-privilege security** and encrypt sensitive environment variables.
* Configured **CloudWatch Logs** for centralized logging and monitoring of build and deployment stages.
* Wrote **AWS CDK** to provision all pipeline resources programmatically, reducing manual setup time.

## Example Notification

When a pipeline stage fails, the Lambda function sends a notification to Google Chat in the following format:

The MyPipeline has FAILED in Build stage at 2025-09-22T12:34:56Z in Production Environment. Reason: Docker build failed due to missing dependencies.


## 🏗️ Architecture

Here’s the high-level workflow of the notification system:

![Architecture Workflow](<serverless-monitoring.drawio (2).png>)


## **Security Notice:**  
> For security reasons, this project does **not include real ARNs, resource IDs, or secret keys**.  
> Users must provide their own AWS resource identifiers and secrets when deploying the pipeline.  
> This ensures that sensitive information is not exposed in the public repository.
