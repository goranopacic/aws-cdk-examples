#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { Cdk1Stack } from '../lib/cdk1-stack';

const app = new cdk.App();
new Cdk1Stack(app, 'Cdk1Stack');
