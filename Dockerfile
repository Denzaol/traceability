FROM node:20-alpine

# Install curl and wget for container health checks (required by Coolify)
RUN apk add --no-cache curl wget

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy project files
COPY . .

# Expose the application port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Define container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the server
CMD ["npm", "start"]
