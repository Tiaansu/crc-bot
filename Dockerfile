FROM oven/bun:latest AS base
WORKDIR /usr/src/app

FROM base AS deps
RUN mkdir -p /temp/bot
COPY package.json bun.lock /temp/bot/
RUN cd /temp/bot && bun install --frozen-lockfile

FROM base AS release
COPY --from=deps /temp/bot/node_modules node_modules
COPY . .

RUN apt-get update && apt-get install -y tzdata && \
    ln -snf /usr/share/zoneinfo/Asia/Manila /etc/localtime && \
    echo "Asia/Manila" > /etc/timezone && \
    rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Manila

USER bun

CMD ["sh", "-c", "bun run db:push && bun start"]