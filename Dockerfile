# Frontend Build Stage
FROM node:22-alpine AS frontend
WORKDIR /app/web

# Install pnpm
RUN npm install -g pnpm

# Copy frontend configuration files
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY web .
# Build with output to dist directory inside web
RUN pnpm vite build --outDir dist

# Backend Build Stage
FROM golang:alpine AS backend
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git build-base

# Copy go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Copy built frontend assets to the expected embed location
# Based on common Memos structure, ensuring the dist contents are where go:embed looks
COPY --from=frontend /app/web/dist ./server/router/frontend/dist

# Build the binary
RUN go build -o memos ./cmd/memos/main.go

# Final Stage
FROM alpine:latest
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Copy binary from backend stage
COPY --from=backend /app/memos /app/memos

# Create data directory
RUN mkdir -p /var/opt/memos

# Set environment variables
ENV MEMOS_MODE=prod
ENV MEMOS_PORT=5230
ENV MEMOS_DATA=/var/opt/memos

# Expose the application port
EXPOSE 5230

# Run the application
ENTRYPOINT ["./memos"]
