import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import { VanillaExtractPlugin } from '@vanilla-extract/webpack-plugin';

// __dirname polyfill for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDevelopment = process.env.NODE_ENV === 'development';

export default defineConfig({
  entry: {
    main: './src/main.tsx',
  },
  output: {
    publicPath: '/',
  },
  resolve: {
    extensionAlias: {
      '.js': ['.js', '.tsx', '.ts'],
      '.mjs': ['.mjs', '.ts'],
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  module: {
    rules: [
      { test: /\.m?js?$/, resolve: { fullySpecified: false } },
      {
        test: /\.js$/,
        enforce: 'pre',
        include: /@blocksuite/,
        use: ['source-map-loader'],
      },
      {
        test: /\.ts$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              preserveAllComments: true,
              parser: {
                syntax: 'typescript',
                dynamicImport: true,
                topLevelAwait: false,
                tsx: false,
                decorators: true,
              },
              transform: {
                useDefineForClassFields: false,
                decoratorVersion: '2022-03',
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
        test: /\.tsx$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              preserveAllComments: true,
              parser: {
                syntax: 'typescript',
                dynamicImport: true,
                topLevelAwait: true,
                tsx: true,
                decorators: true,
              },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
                react: {
                  runtime: 'automatic',
                  development: isDevelopment,
                  refresh: isDevelopment,
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
        use: isDevelopment
          ? [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 1,
                  modules: false,
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
            ]
          : [
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
    ...(isDevelopment
      ? []
      : [
          new rspack.CssExtractRspackPlugin({
            filename: '[name].[contenthash].css',
          }),
        ]),
    new VanillaExtractPlugin(),
    ...(isDevelopment ? [new ReactRefreshRspackPlugin()] : []),
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
    liveReload: true,
    historyApiFallback: true,
    static: {
      directory: './public',
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      logging: 'info',
      progress: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: [
      {
        path: '/api',
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
      {
        path: '/graphql',
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
    ],
  },
  devtool: isDevelopment ? 'eval-cheap-module-source-map' : 'source-map',
  experiments: {
    topLevelAwait: true,
  },
});
