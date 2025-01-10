FROM imbios/bun-node

WORKDIR /app

COPY package.json .
COPY tsconfig.json .
COPY server.ts .
COPY server/ server/
COPY bun.lockb .

RUN bun install
RUN bun run build

CMD ["bun", "run", "start"]