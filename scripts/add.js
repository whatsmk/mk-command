'use strict';

const chalk = require('chalk');
const paths = require('../config/paths');
const utils = require('./utils');
const consts = require('../config/consts');

let appName = process.argv[2];

if (typeof appName === 'undefined') {
    console.error('请输入appName:');
    console.log();
    console.log('示例:');
    console.log(`  mk add ${chalk.green('login')}`);
    console.log();
    process.exit(1);
}


utils.yarn(['add', appName, '--registry', consts.mkServerUrl, '--exact'], paths.appSrc)

