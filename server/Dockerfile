# Use Node.js 18
FROM node:18-bullseye

# 1. Install Chrome dependencies & Google Chrome
# We install standard Chrome to avoid "not found" errors
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy the rest of the code
COPY . .

# 5. Create a cache folder for Puppeteer and give permissions
RUN mkdir -p /app/.cache && chmod -R 777 /app/.cache

# 6. Expose the port (Hugging Face uses port 7860 by default)
EXPOSE 7860

# 7. Start the app
CMD ["node", "index.js"]