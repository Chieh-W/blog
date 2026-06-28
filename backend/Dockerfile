FROM m.daocloud.io/docker.io/library/node:20-alpine AS build

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk update \
    && apk add --no-cache \
      build-base \
      gcc \
      g++ \
      make \
      autoconf \
      automake \
      zlib-dev \
      libpng-dev \
      bash \
      vips-dev \
      git \
      python3 \
      pkgconfig

WORKDIR /opt/app

COPY package.json ./

RUN npm config set registry https://registry.npmmirror.com -g \
    && npm config set fetch-retries 5 -g \
    && npm config set fetch-retry-mintimeout 20000 -g \
    && npm config set fetch-retry-maxtimeout 600000 -g \
    && npm install --legacy-peer-deps --verbose

COPY . .

ENV NODE_ENV=production

RUN npm run build

FROM m.daocloud.io/docker.io/library/node:20-alpine AS runner

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk add --no-cache vips-dev

WORKDIR /opt/app

ENV NODE_ENV=production

COPY --from=build /opt/app ./

RUN npm prune --omit=dev \
    && npm cache clean --force \
    && chown -R node:node /opt/app

USER node

EXPOSE 1337

CMD ["npm", "run", "start"]