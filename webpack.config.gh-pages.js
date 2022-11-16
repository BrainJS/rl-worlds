const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    index: './index.ts',
    gridworld_dp: './gridworld_dp/index.ts',
    gridworld_td: './gridworld_td/index.ts',
    puckworld: './puckworld/index.ts',
    waterworld: './waterworld/index.ts',
    'lunar-lander': './lunar-lander/index.ts',
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(tsx|ts)?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.html?$/,
        use: 'raw-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'index.html', to: 'index.html' },
      ],
    }),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.html'],
    alias: {
      'jQuery': path.resolve(__dirname, './node_modules/jquery/dist/jquery.js'),
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '.gh-pages'),
    libraryTarget: 'umd',
  },
};
