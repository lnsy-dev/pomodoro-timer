import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { rspack } from '@rspack/core';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const outputFileName = process.env.OUTPUT_FILE_NAME || 'main.min.js';
const separateCss = process.env.SEPARATE_CSS === 'true';
const port = process.env.PORT || 3000;

/**
 * Check if assets directory exists and has files
 */
const assetsPath = path.join(__dirname, 'assets');
const hasAssets = (() => {
  try {
    return fs.existsSync(assetsPath) && fs.readdirSync(assetsPath).length > 0;
  } catch {
    return false;
  }
})();

const isDev = process.env.NODE_ENV !== 'production';

export default {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, isDev ? 'dist' : 'docs'),
    filename: isDev ? '[name].js' : outputFileName,
    clean: true,
  },
  mode: isDev ? 'development' : 'production',
  devServer: {
    static: {
      directory: path.join(__dirname, 'assets'),
      publicPath: '/',
    },
    port: port,
    hot: true,
    open: false,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          separateCss ? rspack.CssExtractRspackPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: isDev ? {} : {
              importLoaders: 1,
              modules: false,
            }
          },
          {
            loader: 'postcss-loader',
            options: isDev ? {} : {
              postcssOptions: {
                plugins: [
                  ['cssnano', {
                    preset: ['default', {
                      discardComments: {
                        removeAll: true,
                      },
                    }],
                  }],
                ],
              },
            }
          }
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: path.resolve(__dirname, 'scripts/transform-workers.js'),
          },
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'ecmascript',
                },
                target: 'es2015',
              },
            },
          },
        ],
      },
    ],
  },
  optimization: {
    splitChunks: false,
    runtimeChunk: isDev ? 'single' : false,
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './index.html',
    }),
    ...(separateCss ? [new rspack.CssExtractRspackPlugin()] : []),
    ...(hasAssets
      ? [
          new rspack.CopyRspackPlugin({
            patterns: [
              {
                from: 'assets',
                to: '.',
              },
            ],
          }),
        ]
      : []),
  ],
};
