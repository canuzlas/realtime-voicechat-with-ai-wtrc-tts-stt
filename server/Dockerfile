# Dockerfile for the server
# Lightweight Node.js 18 Alpine image without WRTC dependencies

FROM node:18-alpine

# Install minimal build tools for native modules (if needed)
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /usr/src/app

# Copy package manifests first to leverage Docker cache
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund || npm install --only=production --no-audit --no-fund

# Copy application source
COPY . .

# Expose port used by the server (default 3000)
EXPOSE 3000

ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "index.js"]

