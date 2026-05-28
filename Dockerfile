# Stage 1: Build the frontend React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm ci --workspace=client

# Copy client source and build
COPY client/ ./client/
RUN npm run build

# Stage 2: Production release
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --only=production --workspace=server

# Copy server code and build assets
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

ENV PORT=5000
ENV NODE_ENV=production
ENV CONVERTER_URL=http://converter:3000

EXPOSE 5000

CMD ["npm", "start", "--workspace=server"]
