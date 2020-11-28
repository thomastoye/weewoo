/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const getVersion = () => require('./package.json').version

const getIncludedDependencies = () => {
  // Webpack defines some externals
  // To make the Firebase runtime fetch those, set them as dependencies in the generated package.json

  const webpackConfig = require('./webpack.config')
  const parentPackageJson = require('./package.json')

  const externals = Array.isArray(webpackConfig.externals)
    ? webpackConfig.externals
    : Object.keys(webpackConfig.externals)
  const includedDependencies = externals.map((external) => {
    return [external, parentPackageJson.dependencies[external]]
  })

  // TODO use Object.fromEntries
  const res = {}
  includedDependencies.forEach((entry) => (res[entry[0]] = entry[1]))
  return res
}

const packageJson = {
  name: '@toye.io/weewoo-functions-bundled',
  description: 'Serverless functions - bundled by webpack',
  version: getVersion(),
  main: 'bundle.js',
  license: 'GPL-3.0-or-later',
  private: true,
  dependencies: getIncludedDependencies(),
  engines: {
    node: '12',
  },
}

console.log(JSON.stringify(packageJson))
