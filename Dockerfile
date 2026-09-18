FROM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
COPY --from=frontend /app/frontend/dist ./frontend/dist
ENV NODE_ENV=production
CMD ["npx", "ts-node", "server.ts"]
