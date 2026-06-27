FROM node:24-alpine

ARG NEXT_PUBLIC_API_BASE_URL=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

WORKDIR /app
ENV NPM_CONFIG_STRICT_SSL=false

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/openapi-client/package.json packages/openapi-client/package.json

RUN npm install

COPY openapi.yaml openapi.yaml
COPY packages/openapi-client packages/openapi-client
COPY apps/web apps/web

RUN npm run generate:sdk
RUN npm run build --workspace @wallet/openapi-client
RUN npm run build --workspace @wallet/web

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "@wallet/web"]
