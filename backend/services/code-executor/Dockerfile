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
    && rm -rf /var/lib/apt/lists/*

# Install Go
RUN curl -sSL https://golang.org/dl/go1.21.3.linux-x86_64.tar.gz | tar -xz -C /usr/local \
    && ln -s /usr/local/go/bin/go /usr/bin/go

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH=/root/.cargo/bin:$PATH

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
