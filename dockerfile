# ---------- BASE ----------
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---------- DEV STAGE ----------
FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# ---------- BUILD STAGE ----------
FROM base AS builder
COPY . .
RUN npm ci
RUN npm run build

# ---------- PRODUCTION ----------
FROM node:20-alpine
WORKDIR /app
COPY .env .env
COPY package*.json ./
RUN npm ci 

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]
