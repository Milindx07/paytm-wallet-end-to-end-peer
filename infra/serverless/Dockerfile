FROM node:24-alpine

WORKDIR /app
ENV NPM_CONFIG_STRICT_SSL=false
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY index.js index.js

EXPOSE 4100

CMD ["npm", "start"]
