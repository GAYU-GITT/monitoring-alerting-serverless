# monitoring-alerting-serverless
A serverless architecture used for monitoring the CI/CD and alerting

This project provisions an AWS infrastructure using **CDK** that sends AWS CodePipeline status notifications to a **Google Chat space** via webhook.
It integrates **SNS → Lambda → Google Chat** to notify your team whenever a pipeline **fails**.

## 🏗️ Architecture

Here’s the high-level workflow of the notification system:

![alt text](<serverless-monitoring.drawio (1).png>)