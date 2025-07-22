FROM rust:1.88.0-bookworm AS builder

RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  git curl ca-certificates gnupg
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | sh -
RUN apt-get install -y nodejs

WORKDIR /workspace
COPY . .

RUN corepack enable yarn
RUN yarn config set --json supportedArchitectures.cpu '["x64", "arm64", "arm"]'
RUN yarn config set --json supportedArchitectures.libc '["glibc"]'
RUN yarn install --immutable

# Build the native module for current platform only
RUN yarn workspace @afk/server-native build

RUN yarn workspace @afk/app build
RUN yarn oa server prisma generate
RUN yarn workspace @afk/server build

FROM node:22-bookworm AS deps

WORKDIR /app
COPY . .

RUN corepack enable yarn
RUN yarn config set --json supportedArchitectures.cpu '["x64", "arm64", "arm"]'
RUN yarn config set --json supportedArchitectures.libc '["glibc"]'
RUN yarn workspaces focus @afk/server --production

FROM node:22-bookworm-slim AS production

RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  openssl \
  libjemalloc2 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /workspace/packages/backend/server/dist ./dist
COPY --from=builder /workspace/packages/backend/server/package.json ./package.json
COPY --from=builder /workspace/packages/frontend/app/dist ./static

COPY --from=deps /workspace/node_modules ./node_modules

ENV LD_PRELOAD=libjemalloc.so.2
ENV NODE_ENV=production
EXPOSE 3010

CMD ["node", "dist/main.mjs"]
