FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

RUN apk add --no-cache \
    python3 \
    g++ \
    openjdk11 \
    go \
    rustup \
    mono \
    bash \
    && rustup-init -y --no-modify-path \
    && . $HOME/.cargo/env

RUN npm install -g typescript ts-node

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
