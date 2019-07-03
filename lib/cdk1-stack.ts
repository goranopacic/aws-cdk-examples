import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import ecs = require('@aws-cdk/aws-ecs');
import apigateway = require('@aws-cdk/aws-apigateway');
import { IntegrationOptions, IntegrationResponse, MethodOptions, MethodResponse, EmptyModel } from '@aws-cdk/aws-apigateway';
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');
import { ServicePrincipal } from '@aws-cdk/aws-iam';
import sqs = require('@aws-cdk/aws-sqs');
import { Duration } from '@aws-cdk/core';

export class Cdk1Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*
    var i:number = 1 
    while(i<=10) { 

      new s3.Bucket(this,'EstehBucket' + i, {
        versioned: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });
      i++;
    }*/

    const sqsQueue = new sqs.Queue(this, 'SQS', {
      visibilityTimeout: Duration.seconds(300)
    });
  

   const hello = new lambda.Function(this, 'hello', {
      runtime: lambda.Runtime.NODEJS_8_10,
      handler: 'hello.handler',
      code: lambda.Code.asset('./lambda')
    });

    const rootApi = new apigateway.RestApi(this, 'books-api', {});
    const integration = new apigateway.LambdaIntegration(hello);

    //rootApi.root.addMethod('ANY');
    
    const books = rootApi.root.addResource('books');
    const echo = books.addResource('echo');
    const echoMethod = echo.addMethod('GET', integration);
    
    //Example 2 / send email

    //Create an IAM Role for API Gateway to assume
const apiGatewayRole = new iam.Role(this, 'ApiGatewayRole', {
  assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
});

//Create an empty response model for API Gateway
var model :EmptyModel = {
  modelId: "Empty"
};
//Create a method response for API Gateway using the empty model
var methodResponse :MethodResponse = {
  statusCode: '200',
  responseModels: {'application/json': model}
};
//Add the method options with method response to use in API Method
var methodOptions :MethodOptions = {
  methodResponses: [
    methodResponse
  ]
};
//Create intergration response for SQS
var integrationResponse :IntegrationResponse = {
  statusCode: '200'
};

//Create integration options for API Method
var integrationOptions :IntegrationOptions = {
  credentialsRole: apiGatewayRole,
  requestParameters: {
    'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'"
  },
  requestTemplates: {
    'application/json': 'Action=SendMessage&QueueUrl=$util.urlEncode("' + sqsQueue.queueUrl + '")&MessageBody=$util.urlEncode($input.body)'
  },
  integrationResponses: [
    integrationResponse
  ]
};


//Create the SQS Integration
const apiGatewayIntegration = new apigateway.AwsIntegration({ 
  service: "sqs",
  path: this.account + '/' + sqsQueue.queueName,
  integrationHttpMethod: "POST",
  options: integrationOptions,
});


    const email = rootApi.root.addResource('email');
    const emailsend = email.addResource('send');
    const sendmethod = emailsend.addMethod('POST', apiGatewayIntegration, methodOptions);

//Grant API GW IAM Role access to post to SQS
sqsQueue.grantSendMessages(apiGatewayRole);
    
    
/*

{
  "RawMessage": 
    {
      "Data": "$util.base64Encode("From: $input.json('$.From')\nTo: $input.json('$.To')\nSubject:$input.json('$.Subject')\nContent-Type: text/plain\n\n$input.json('$.Message').\n\n")"
    }
}
*/


  }
}
