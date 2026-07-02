FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN mkdir -p /app/data /app/examples
COPY --from=build /app/dist ./dist
COPY examples/group-rules.example.json ./examples/group-rules.example.json
COPY .env.example README.md ARCHITECTURE.md LICENSE ./
EXPOSE 8080
CMD ["node", "dist/index.js"]
