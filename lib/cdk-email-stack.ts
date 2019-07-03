import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import ecs = require('@aws-cdk/aws-ecs');
import apigateway = require('@aws-cdk/aws-apigateway');
import { IntegrationOptions, IntegrationResponse, MethodOptions, MethodResponse, EmptyModel } from '@aws-cdk/aws-apigateway';
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');
import { ServicePrincipal, CompositePrincipal } from '@aws-cdk/aws-iam';
import sqs = require('@aws-cdk/aws-sqs');
import { Duration } from '@aws-cdk/core';
import { IncomingMessage } from 'http';
import { Session } from 'inspector';
import ses = require('@aws-cdk/aws-ses');

export class CdkEmailStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);



    const rootApi = new apigateway.RestApi(this, 'email-api', {});
    
    
    //Example 2 / send email

    //Create an IAM Role for API Gateway to assume
    const apiGatewayRole = new iam.Role(this, 'ApiGatewayRole', {
    assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
/*    assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('apigateway.amazonaws.com'),
        new iam.ServicePrincipal('ses.amazonaws.com'),
      ),*/
    });

    apiGatewayRole.addToPolicy(new iam.PolicyStatement({
        resources: ['*'],
        actions: ['ses:SendEmail','ses:SendRawEmail'] }));

    //FINAL1
    const sendEmailRole = new iam.Role(this,'SendEmailRole', {
        assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        
    });

    
    
    const policystatement = new iam.PolicyStatement({
        resources: ['*'],
        actions: ['ses:SendEmail','ses:SendRawEmail'] 
    });

    const policy = new iam.Policy(this, "SendEmailPolicy", {});
    policy.addStatements(policystatement);

    sendEmailRole.attachInlinePolicy(policy);

    
    /*.addStatement(new iam.PolicyStatement().
    addAccountRootPrincipal().
    addAction('sts:AssumeRole'));

    const iampolicy = new iam.Policy(this, "SendEmailPolicy");
    iampolicy
     new iam.PolicyStatement({
        resources: ['*'],
        actions: ['ses:SendEmail','ses:SendRawEmail'] });

    sendEmailRole.addManagedPolicy(iampolicy);
*/
    


    

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

    //SQS Create integration options for API Method
    var integrationOptionsEmail :IntegrationOptions = {

    credentialsRole: apiGatewayRole,
    requestParameters: {
        'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'"
    },
    requestTemplates: {
        'application/json': 'Action=SendEmail&Source=$util.urlEncode($input.path(\"$.from\"))&Destination.ToAddresses.member.1=$util.urlEncode($input.path(\"$.to\"))&Message.Subject.Data=$util.urlEncode($input.path(\"$.subject\"))&Message.Body.Text.Data=$util.urlEncode($input.path(\"$.body\"))'
    },
    integrationResponses: [
        integrationResponse
    ]
    };


    //Create the SQS Integration
    const apiGatewayIntegrationEmail = new apigateway.AwsIntegration({ 
    service: "email",
  //  path: this.account + '/' + sqsQueue.queueName,
    //action: "SendEmail",
    integrationHttpMethod: "POST",
    options: integrationOptionsEmail,
    path: "arn:"+this.partition +":apigateway:"+ this.region +":email:path//"
    });


    const email = rootApi.root.addResource('email');
    const emailsend = email.addResource('send');
    const sendmethod = emailsend.addMethod('POST', apiGatewayIntegrationEmail, methodOptions);

    //Grant API GW IAM Role access to post to SQS
    //sqsQueue.grantSendMessages(apiGatewayRole);
        
    
    //SEND EMAIL







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
