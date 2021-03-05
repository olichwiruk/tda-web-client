FROM node:12-alpine as builder
WORKDIR /app
RUN apk update && apk add gettext
COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN envsubst < /app/public/config.js.template > /app/public/config.js
RUN yarn build

FROM alpine as production
WORKDIR /app
COPY --from=builder /app/dist ./dist
