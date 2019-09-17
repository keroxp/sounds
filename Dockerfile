FROM node:12.10-alpine as build
RUN apk update --no-cache
COPY package.json yarn.lock /app/
WORKDIR /app
RUN yarn
COPY webpack.config.js tsconfig.json /app/
COPY src /app/src
RUN NDOE_ENV=production yarn webpack
RUN yarn run tsc
COPY . /app

FROM node:12.10-alpine
ENV NODE_ENV=production
COPY --from=build /app /app
CMD ["node", "/app/dist/server.js"]

