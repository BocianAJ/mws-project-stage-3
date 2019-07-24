const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/sw.js',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist'
    },
    output: {
        filename: 'sw.js',
        path: path.resolve(__dirname, 'dist')
    }
};
