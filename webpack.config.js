const path = require('path');
const webpack = require('webpack');

const web = {
  target: 'web',
  entry: './gridworld_td/index.ts',
  devtool: 'source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  },
  mode: 'production',
  plugins: [
    // new webpack.ProvidePlugin({
    //   jQuery: 'jQuery',
    // }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    // alias: {
    //   'jQuery': path.resolve(__dirname, './node_modules/jquery/dist/jquery.js'),
    // }
  },
  output: {
    filename: 'reinforce-browser.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
  },
};

const node = {
  ...web,
  target: 'node',
  output: {
    filename: 'reinforce.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
  }
};

module.exports = [web, node];
