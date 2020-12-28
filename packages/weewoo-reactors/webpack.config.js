/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

module.exports = {
  entry: './src/index.ts',
  devtool: 'source-map',
  target: 'node',
  // mode: 'production',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          transpileOnly: true, // This goes a lot faster and it's safe since we have a separate build step
        },
      },
      {
        // For node binary relocations, include ".node" files as well here
        test: /\.(m?js|node)$/,
        // it is recommended for Node builds to turn off AMD support
        parser: { amd: false },
        use: {
          loader: '@vercel/webpack-asset-relocator-loader',
          options: {
            // optional, base folder for asset emission (eg assets/name.ext)
            outputAssetBase: 'assets',
            // optional, restrict asset emissions to only the given folder.
            filterAssetBase: process.cwd(),
            // optional, permit entire __dirname emission
            // eg `const nonAnalyzable = __dirname` can emit everything in the folder
            emitDirnameAll: false,
            // optional, permit entire filterAssetBase emission
            // eg `const nonAnalyzable = process.cwd()` can emit everything in the cwd()
            emitFilterAssetBaseAll: false,
            // optional, a list of asset names already emitted or
            // defined that should not be emitted
            existingAssetNames: [],
            wrapperCompatibility: false, // optional, default
            // build for process.env.NODE_ENV = 'production'
            production: true, // optional, default is undefined
            cwd: process.cwd(), // optional, default
            debugLog: false, // optional, default
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    modules: ['node_modules', '../../node_modules'],
  },
  output: {
    filename: 'build.js',
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, 'build'),
  },
  optimization: {
    usedExports: true,
  },
}
