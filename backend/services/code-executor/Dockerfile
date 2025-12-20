FROM node:20-slim

# Install system dependencies and development tools
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    gcc \
    make \
    python3 \
    python3-dev \
    python3-pip \
    git \
    curl \
    openjdk-17-jdk \
    mono-complete \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Go
RUN curl -sL https://golang.org/dl/go1.21.3.linux-x86_64.tar.gz | tar -xz -C /usr/local \
    && /usr/local/go/bin/go version

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && /root/.cargo/bin/rustc --version

# Set permanent PATH for all tools
ENV PATH=/usr/local/go/bin:/root/.cargo/bin:/root/.local/bin:$PATH

# Verify all toolchains are available
RUN echo "=== Verifying Toolchains ===" \
    && go version \
    && rustc --version \
    && javac -version \
    && g++ --version \
    && python3 --version \
    && node --version \
    && npx --version \
    && mono --version \
    && sqlite3 --version

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
