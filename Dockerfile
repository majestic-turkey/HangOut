FROM node:24-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN --mount=type=secret,id=SESSION_SECRET,env=SESSION_SECRET \
    echo "Mounting session secret"
CMD ["npx", "ts-node", "server.ts"]