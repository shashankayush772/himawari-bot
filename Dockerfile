# ── Simple Node.js image (Lavalink is external, no Java needed) ──
FROM node:18-slim

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
