# ── Simple Node.js image (Lavalink is external, no Java needed) ──
FROM node:20-slim

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Make the startup script executable
RUN chmod +x render-start.sh

# Render requires a PORT to be exposed for health checks on Web Services
EXPOSE 10000

CMD ["./render-start.sh"]
