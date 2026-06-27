FROM node:24-alpine

WORKDIR /app
ENV NPM_CONFIG_STRICT_SSL=false

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/openapi-client/package.json packages/openapi-client/package.json

RUN npm install

COPY openapi.yaml openapi.yaml
COPY apps/api apps/api

RUN npm run build --workspace @wallet/api

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace", "@wallet/api"]
