FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_OPTIONS "--max_old_space_size=4096"
RUN npm run build

RUN apt-get update && apt-get install -y gettext

ENTRYPOINT ["sh", "scripts/feed_with_env_vars.sh", "dist/config.template.js", "dist/config.js"]
