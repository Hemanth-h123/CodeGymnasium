FROM node:20-bullseye

# Install language toolchains: Java, C++, Go, Rust, .NET SDK
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      openjdk-17-jdk \
      g++ \
      golang-go \
      rustc cargo \
      sqlite3 \
      wget \
      apt-transport-https \
      gnupg && \
    wget https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb && \
    dpkg -i /tmp/packages-microsoft-prod.deb && \
    apt-get update && \
    apt-get install -y --no-install-recommends dotnet-sdk-8.0 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies (including dev, because runtime needs typescript for TS transpile)
COPY package.json package-lock.json* ./
COPY backend/services/auth-service/package.json ./backend/services/auth-service/package.json
RUN cd backend/services/auth-service && npm install --include=dev

# Copy source
COPY backend/services/auth-service ./backend/services/auth-service

# Build
RUN cd backend/services/auth-service && npm run build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "backend/services/auth-service/dist/index.js"]
