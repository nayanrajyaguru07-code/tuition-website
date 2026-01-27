FROM ghcr.io/puppeteer/puppeteer:19.11.1

USER root
WORKDIR /app

COPY package*.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
ENV NODE_ENV=production

RUN npm install

COPY . .

RUN npx prisma generate

RUN chown -R pptruser:pptruser /app
USER pptruser

EXPOSE 7860
CMD ["node", "index.js"]
