# Dockerfile for AML User Management Portal (Vite + React + TypeScript)

# Stage 1: Build the React app
FROM node:20-alpine AS builder
WORKDIR /app

# Build argument for API URL
ARG VITE_API_BASE_URL=https://actimizemduat.ubagroup.com:8444/api

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy the rest of the source code
COPY . .

# Create .env file from build argument
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env

# Build the app
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
