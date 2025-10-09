# Use Node.js 20 as base image (not Alpine to avoid memory issues)
FROM node:20

# Add build argument to force rebuild
ARG CACHE_BUST=3

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy all package.json files for dependency resolution
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# Install dependencies with reduced memory pressure
RUN npm ci --maxsockets 1 --no-audit --no-fund --prefer-offline

# Copy source code
COPY . .

# Build shared package first
RUN NODE_OPTIONS="--max-old-space-size=4096" NX_DAEMON=false npx nx build shared

# Build the API (needed for module resolution)
RUN NODE_OPTIONS="--max-old-space-size=4096" NX_DAEMON=false npx nx build api

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start the API using the built version
CMD ["node", "apps/dist/api/main.js"]
