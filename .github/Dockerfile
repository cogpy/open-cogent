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

# Build the native module for Linux target
RUN yarn workspace @afk/server-native build

# Create architecture-specific copies for bundler
RUN cp packages/backend/native/server-native.node \
      packages/backend/native/server-native.x64.node && \
    cp packages/backend/native/server-native.node \
      packages/backend/native/server-native.arm64.node && \
    cp packages/backend/native/server-native.node \
      packages/backend/native/server-native.armv7.node

RUN yarn workspace @afk/app build
RUN yarn oa server prisma generate
RUN yarn workspace @afk/server build

RUN yarn workspaces focus @afk/server --production

FROM node:22-bookworm-slim AS production

RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  openssl \
  libjemalloc2 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY --from=builder /workspace/packages/backend/server/dist ./packages/backend/server/dist
COPY --from=builder /workspace/packages/backend/server/package.json ./packages/backend/server/package.json
COPY --from=builder /workspace/packages/backend/native ./packages/backend/native
COPY --from=builder /workspace/node_modules ./node_modules

COPY --from=builder /workspace/packages/frontend/app/dist ./packages/backend/server/static

ENV LD_PRELOAD=libjemalloc.so.2
ENV NODE_ENV=production
EXPOSE 3010

CMD ["node", "/workspace/packages/backend/server/dist/main.mjs"]
