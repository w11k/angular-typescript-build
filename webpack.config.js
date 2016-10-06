const webpack = require('webpack');
const path = require("path");

function bower(pathSuffix) {
    return path.resolve("./bower_components/" + pathSuffix);
}

function node_modules(pathSuffix) {
    return path.resolve("./node_modules/" + pathSuffix);
}

module.exports = {
    entry: "./src/init.js",
    output: {
        path: __dirname,
        filename: "target/build/bundle.js"
    },
    resolve: {
        extensions: ["", '.js', '.ts', '.tsx']
        ,
        alias: {
            // "lodash": node_modules("lodash/lodash.min.js"),
            "angular": bower("angular/angular.min.js"),
            "angular-bootstrap": bower("angular-bootstrap/ui-bootstrap.min.js"),
            "angular-sanitize": bower("angular-sanitize/angular-sanitize.min.js"),
            "angular-cookies": bower("angular-cookies/angular-cookies.min.js"),
            "angular-ui-router": bower("angular-ui-router/release/angular-ui-router.min.js")
        },
        root: [
            path.resolve('./app/modules'),
            path.resolve('./bower_components')
        ]
    },
    devtool: 'source-map',
    // devtool: 'source-map',
    // devtool: 'cheap-module-eval-source-map',
    // devServer: {
    //     inline: true
    // },
    module: {
        loaders: [
            {
                test: /\.ts$/,
                loader: "tslint"
            },
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader'
            }
        ]
    },
    plugins: [
            /*
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.AggressiveMergingPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false
                // ,
                // sequences: true,
                // dead_code: true,
                // conditionals: true,
                // booleans: true,
                // unused: true,
                // if_return: true,
                // join_vars: true,
                // drop_console: true
            }
            ,
            // mangle: {
            //     except: ['$super', '$', 'exports', 'require']
            // }
            // ,
            output: {
                comments: false
            }
        })
        */
    ]
};
