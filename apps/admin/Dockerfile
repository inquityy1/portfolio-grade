# Use Node.js 20 as base image (not Alpine to avoid memory issues)
FROM node:20

# Install system dependencies for Playwright browsers
RUN apt-get update && apt-get install -y \
    libnspr4 \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxkbcommon0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy all package.json files for dependency resolution
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# Install dependencies with increased memory
RUN npm ci --maxsockets 1 --no-audit --no-fund

# Copy source code
COPY . .

# Install Playwright browsers for e2e testing (after source code is copied)
RUN npx playwright install chromium

# Build the Admin app with environment variable
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npx nx build admin

# Expose port
EXPOSE 4200

# Start the Admin app (disable Nx daemon to avoid plugin worker issues)
CMD ["npx", "nx", "serve", "admin", "--host", "0.0.0.0", "--skip-nx-cache"]
