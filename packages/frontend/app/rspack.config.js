import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import { VanillaExtractPlugin } from '@vanilla-extract/webpack-plugin';

// __dirname polyfill for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  entry: {
    main: './src/main.tsx',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
                decorators: false,
                dynamicImport: false,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: process.env.NODE_ENV === 'development',
                  refresh: process.env.NODE_ENV === 'development',
                },
              },
              target: 'es2020',
            },
            module: {
              type: 'es6',
            },
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          rspack.CssExtractRspackPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['@tailwindcss/postcss'],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './index.html',
      inject: true,
    }),
    new rspack.CssExtractRspackPlugin({
      filename: '[name].[contenthash].css',
    }),
    new VanillaExtractPlugin(),
    ...(process.env.NODE_ENV === 'development'
      ? [new ReactRefreshRspackPlugin()]
      : []),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          name: 'vendors',
          priority: 10,
          enforce: true,
        },
      },
    },
  },
  devServer: {
    port: 8080,
    open: true,
    hot: true,
    historyApiFallback: true,
    static: {
      directory: './public',
    },
    proxy: [
      {
        path: '/api',
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
    ],
  },
  devtool:
    process.env.NODE_ENV === 'development'
      ? 'eval-cheap-module-source-map'
      : 'source-map',
});
