// @ts-check
/* eslint-env commonjs, jasmine, node */
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SpecReporter, StacktraceOption } = require('jasmine-spec-reporter')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { join } = require('path')

/**
 * @type { import("protractor").Config }
 */
exports.config = {
  allScriptsTimeout: 11000,
  specs: ['./src/**/*.e2e-spec.ts'],
  capabilities: {
    browserName: 'chrome',
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    print: function () {},
  },
  onPrepare() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('ts-node').register({
      project: join(__dirname, './tsconfig.json'),
    })
    jasmine.getEnv().addReporter(
      new SpecReporter({
        spec: {
          displayStacktrace: StacktraceOption.PRETTY,
        },
      })
    )
  },
}
