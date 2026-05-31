# ── Stage 1: Install Node.js dependencies ──
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# ── Stage 2: Final image with Java + Node.js ──
FROM eclipse-temurin:21-jre-jammy

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Make the startup script executable
RUN chmod +x render-start.sh

# Render requires a PORT to be exposed for health checks on Web Services
# We use a simple health endpoint; set PORT env var in Render dashboard
EXPOSE 10000

CMD ["./render-start.sh"]
