# Dockerfile for the server
# Uses Node 18 (recommended LTS) on Debian Bullseye and installs common build tools
# This helps with native modules (wrtc) when prebuilt binaries are not available.

FROM node:18-bullseye

# Install build dependencies and common libraries
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    python3-dev \
    pkg-config \
    git \
    ca-certificates \
    curl \
    libnss3 \
    libasound2-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package manifests first to leverage Docker cache
COPY package.json package-lock.json* ./

# Install dependencies (production by default; adjust as needed)
# Ensure node-gyp and node-pre-gyp are available for native module postinstall scripts
RUN npm install -g node-gyp node-pre-gyp
RUN npm install --no-audit --no-fund

# Copy application source
COPY . .

# Expose port used by the server (default 4000)
EXPOSE 4000

ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]

# Command to run the container with environment variables from .env file
# docker run -p 4000:4000 --env-file ./server/.env chat-server

