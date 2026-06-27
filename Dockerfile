# ── Use Ubuntu Jammy ──
FROM ubuntu:22.04

# Install Node.js 20, ffmpeg (for audio), and build tools (for native modules)
RUN apt-get update && \
    apt-get install -y curl ca-certificates ffmpeg python3 make g++ && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Fix Windows CRLF line endings in shell script & make executable
RUN sed -i 's/\r$//' render-start.sh && chmod +x render-start.sh

# Render requires a PORT to be exposed for health checks on Web Services
EXPOSE 10000

CMD ["./render-start.sh"]
