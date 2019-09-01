const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/dbhelper.js',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist'
    },
    output: {
        filename: 'dbhelper.js',
        path: path.resolve(__dirname, 'dist')
    }
};