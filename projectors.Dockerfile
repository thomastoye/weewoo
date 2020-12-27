FROM node:14-alpine

WORKDIR /usr/src/app

COPY yarn.lock lerna.json package.json tsconfig.json /usr/src/app/
COPY packages/ /usr/src/app/packages/

RUN yarn install --pure-lockfile --non-interactive && yarn build

CMD ["node", "packages/weewoo-reactors/dist/index.js"]
