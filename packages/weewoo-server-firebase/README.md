## Runing locally

Get the configuration:

```bash
$ yarn run serve-locally
```

There is also `yarn firebase serve --only functions` and `yarn firebase functions:shell` but it seems like `yarn firebase emulators:start` is the new standard.

## Deployment

`webpack` is used to bundle everything up and place it in a `deploy/` directory. A minimal `package.json` is generated for the deployment since Firebase needs that. Externals from `webpack.config.js` are set as dependencies in that `package.json`, they will then be installed by the Cloud Functions runtime.

```
$ yarn run deploy:prod
```
