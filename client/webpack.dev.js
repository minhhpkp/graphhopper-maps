const { mergeWithRules, CustomizeRule } = require('webpack-merge')
const path = require('path')
const fs = require('fs')

const common = require('./webpack.common.js')

const localConfig = path.resolve(__dirname, 'config-local.js')
const defaultConfig = path.resolve(__dirname, 'config.js')
let configFilename
if (fs.existsSync(localConfig)) {
    configFilename = localConfig
} else if (fs.existsSync(defaultConfig)) {
    configFilename = defaultConfig
} else {
    throw new Error(`The config file is missing: ${defaultConfig}`)
}
const config = require(configFilename)

const develop = {
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        static: path.resolve(__dirname, 'dist'),
        https: false,
        port: 3001,
        host: '0.0.0.0',
        proxy: [
            {
                context: ['/api'],
                target: config.poiApi,
                secure: false,
                changeOrigin: true,
            },
        ],
    },
}

const mergePattern = {
    module: {
        rules: {
            test: CustomizeRule.Match,
            exclude: CustomizeRule.Match,
            use: {
                loader: CustomizeRule.Match,
                options: CustomizeRule.Replace,
            },
        },
    },
}

module.exports = mergeWithRules(mergePattern)(common, develop)
