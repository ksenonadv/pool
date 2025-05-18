const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/game/worker/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist', 'worker'),
    filename: 'index.js',
    clean: true, // Clean dist before emit
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              declaration: false, // No .d.ts files
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, './tsconfig.json'),
      }),
    ],
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'inline-source-map',
};