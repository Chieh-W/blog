FROM node:20-alpine AS build

ARG ALPINE_MIRROR=mirrors.aliyun.com
ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV npm_config_nodedir=/usr/local

RUN set -eux; \
    ALPINE_VERSION="$(cut -d. -f1,2 /etc/alpine-release)"; \
    set_repos() { \
      mirror="$1"; \
      printf "https://%s/alpine/v%s/main\nhttps://%s/alpine/v%s/community\n" "$mirror" "$ALPINE_VERSION" "$mirror" "$ALPINE_VERSION" > /etc/apk/repositories; \
    }; \
    apk_add_with_retry() { \
      packages="$*"; \
      for mirror in "$ALPINE_MIRROR" dl-cdn.alpinelinux.org mirrors.tuna.tsinghua.edu.cn mirrors.ustc.edu.cn; do \
        set_repos "$mirror"; \
        for attempt in 1 2 3; do \
          apk update && apk add --no-cache $packages && exit 0; \
          sleep $((attempt * 5)); \
        done; \
      done; \
      exit 1; \
    }; \
    apk_add_with_retry \
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

RUN set -eux; \
    test -f /usr/local/include/node/node.h; \
    npm config set nodedir /usr/local; \
    npm config set registry "$NPM_REGISTRY"; \
    npm config set fetch-retries 5; \
    npm config set fetch-retry-mintimeout 20000; \
    npm config set fetch-retry-maxtimeout 120000; \
    npm install --legacy-peer-deps --no-audit --fund=false --loglevel=warn || \
    (npm config set registry https://registry.npmjs.org && npm install --legacy-peer-deps --no-audit --fund=false --loglevel=warn)

COPY . .

ENV NODE_ENV=production

RUN npm run build

FROM node:20-alpine AS runner

ARG ALPINE_MIRROR=mirrors.aliyun.com

RUN set -eux; \
    ALPINE_VERSION="$(cut -d. -f1,2 /etc/alpine-release)"; \
    set_repos() { \
      mirror="$1"; \
      printf "https://%s/alpine/v%s/main\nhttps://%s/alpine/v%s/community\n" "$mirror" "$ALPINE_VERSION" "$mirror" "$ALPINE_VERSION" > /etc/apk/repositories; \
    }; \
    apk_add_with_retry() { \
      packages="$*"; \
      for mirror in "$ALPINE_MIRROR" dl-cdn.alpinelinux.org mirrors.tuna.tsinghua.edu.cn mirrors.ustc.edu.cn; do \
        set_repos "$mirror"; \
        for attempt in 1 2 3; do \
          apk update && apk add --no-cache $packages && exit 0; \
          sleep $((attempt * 5)); \
        done; \
      done; \
      exit 1; \
    }; \
    apk_add_with_retry vips-dev

WORKDIR /opt/app

ENV NODE_ENV=production

COPY --from=build /opt/app ./

RUN npm prune --omit=dev \
    && npm cache clean --force \
    && chown -R node:node /opt/app

USER node

EXPOSE 1337

CMD ["npm", "run", "start"]
