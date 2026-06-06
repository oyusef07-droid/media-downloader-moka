FROM node:20-slim

# Install Python, pip, ffmpeg, and yt-dlp
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip ffmpeg && \
    pip3 install --break-system-packages yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Verify yt-dlp is installed
RUN yt-dlp --version

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "src/index.js"]
