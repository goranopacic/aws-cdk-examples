#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');

import { Cdk1Stack } from '../lib/cdk1-stack';
import { CdkEmailStack } from '../lib/cdk-email-stack';

const app = new cdk.App();
new Cdk1Stack(app, 'Cdk1Stack');

new CdkEmailStack(app, 'CdkEmailStack');
