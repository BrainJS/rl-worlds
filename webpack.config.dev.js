const path = require('path');
const webpackConfigGhPages = require('./webpack.config.gh-pages');

module.exports = {
  ...webpackConfigGhPages,
  watch: true,
  devtool: 'inline-source-map',
  devServer: {
    static: './',
    compress: true,
    port: 9000
  },
  mode: 'development',
  output: {
    filename: 'reinforce-browser.js',
    path: path.resolve(__dirname, '.dev-server'),
    libraryTarget: 'umd',
  },
};
