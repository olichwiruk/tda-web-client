FROM node:12-alpine as builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build

FROM alpine as production
WORKDIR /app
RUN apk update && apk add gettext
COPY --from=builder /app/dist ./dist
ENTRYPOINT envsubst < dist/spa/config.js.template > dist/spa/config.js
