FROM node:14-alpine AS builder
WORKDIR /usr/src/app
COPY yarn.lock lerna.json package.json tsconfig.json /usr/src/app/
COPY packages/ /usr/src/app/packages/

RUN yarn install --pure-lockfile --non-interactive && yarn build


FROM node:14-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/packages/weewoo-reactors/build/ .

CMD ["node", "--enable-source-maps", "build.js"]
