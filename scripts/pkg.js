'use strict';

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

//promise未处理reject的异常
process.on('unhandledRejection', err => {
    throw err;
});

require('../config/env');

const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const webpack = require('webpack');
const config = require('../config/webpack.config.pkg');
const paths = require('../config/paths');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const printBuildError = require('react-dev-utils/printBuildError');
const template = require('art-template');

const measureFileSizesBeforeBuild =
    FileSizeReporter.measureFileSizesBeforeBuild;

const appDirectory = fs.realpathSync(process.cwd());

const appJson = require(paths.appPackageJson);

// 检测必须的文件，不存在自动退出
if (!checkRequiredFiles([paths.appIndexJs])) {
    process.exit(1);
}

measureFileSizesBeforeBuild(paths.appPackage)
    .then(previousFileSizes => {
        //清空目录中文件
        fs.emptyDirSync(paths.appPackage);
        //开始build
        let ret = build(previousFileSizes);
        let libPath = path.resolve(appDirectory, 'node_modules', 'mk-sdk', 'dist', 'release')
        if (!fs.existsSync(paths.appPackage)) {
            fs.mkdirSync(paths.appPackage);
        }
        fs.copySync(libPath, paths.appPackage);
        let ownHtmlPath = path.resolve(appDirectory, 'node_modules', 'mk-sdk', 'template', 'app', 'index.html')
        let appHtmlPath = path.resolve(appDirectory, 'template', 'index.html')
        let html = fs.existsSync(appHtmlPath) ? fs.readFileSync(appHtmlPath, 'utf-8') : fs.readFileSync(ownHtmlPath, 'utf-8');
        let render = template.compile(html, { debug: true });
        html = render({
            appName: (appJson.var && appJson.var.renderApp) || appJson.name,
            title: appJson.description,
            isMock: (appJson.var && appJson.var.isMock) || false,
            token:  (appJson.var && appJson.var.token) || '',
            preApp: (appJson.var && appJson.var.preApp)
                ? JSON.stringify(appJson.var.preApp)
                : '',
            app: JSON.stringify({
                ...(appJson.var && appJson.var.app),
                [appJson.name]: { asset: appJson.name }
            }),

        });
        fs.writeFileSync(path.resolve(paths.appPackage, 'index.html'), html);

        return ret
    })
    .then(
        ({ stats, previousFileSizes, warnings }) => {
            //存在警告
            if (warnings.length) {
                console.log(chalk.yellow('编译警告.\n'));
                console.log(warnings.join('\n\n'));
            } else {
                console.log(chalk.green('编译成功.'));
            }
        },
        err => {
            console.log(chalk.red('编译失败.\n'));
            //输出编译异常
            printBuildError(err);
            process.exit(1);
        }
    );


function build(previousFileSizes) {
    console.log('编译中...');
    let compiler = webpack(config);
    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                return reject(err);
            }
            const messages = formatWebpackMessages(stats.toJson({}, true));

            //存在编译异常
            if (messages.errors.length) {
                if (messages.errors.length > 1) {
                    messages.errors.length = 1;
                }
                return reject(new Error(messages.errors.join('\n\n')));
            }
            return resolve({
                stats,
                previousFileSizes,
                warnings: messages.warnings,
            });
        });
    });
}
