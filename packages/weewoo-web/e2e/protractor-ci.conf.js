/* eslint-env commonjs, jasmine, node */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('./protractor.conf').config

config.capabilities = {
  browserName: 'chrome',
  chromeOptions: {
    args: ['--headless', '--no-sandbox'],
  },
}

exports.config = config
