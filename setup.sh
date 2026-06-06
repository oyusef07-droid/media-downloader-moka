#!/bin/bash
# setup.sh — Linux/macOS setup for Social Media Downloader API

set -e
echo "=== Social Media Downloader API Setup ==="

# Node.js check
node --version >/dev/null 2>&1 || { echo "ERROR: Node.js not found. Install from https://nodejs.org (v18+)"; exit 1; }
echo "Node.js: $(node --version)"

# npm install
echo "Installing npm packages..."
npm install

# Install yt-dlp
echo "Installing yt-dlp..."
if command -v pip3 &>/dev/null; then
    pip3 install yt-dlp --upgrade --break-system-packages 2>/dev/null || pip3 install yt-dlp --upgrade
    echo "yt-dlp installed via pip3"
elif command -v pip &>/dev/null; then
    pip install yt-dlp --upgrade
    echo "yt-dlp installed via pip"
else
    # Download binary
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp 2>/dev/null || \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ~/yt-dlp
    chmod +x /usr/local/bin/yt-dlp 2>/dev/null || chmod +x ~/yt-dlp
    echo "yt-dlp binary downloaded"
fi

# .env setup
[ ! -f .env ] && cp .env.example .env && echo ".env created"

echo ""
echo "=== Setup complete! ==="
echo "Start: npm start"
echo "Health: curl http://localhost:3000/health"
