FROM node:alpine AS node-builder

WORKDIR /backend
COPY package*.json ./
RUN npm install
COPY tsconfig.json rollup.config.js ./
COPY src ./src
RUN npm run build

FROM heroiclabs/nakama:3.22.0

COPY --from=node-builder /backend/build/main.js /nakama/data/modules/build/index.js
COPY local.yml /nakama/data/
