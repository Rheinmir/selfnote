# Project Overview: Memos

## 1. Introduction
Memos is an open-source, lightweight note-taking service that offers a privacy-first integration. This document outlines the project structure, architectural flow, and key technologies used.

## 2. Directory Structure

### Root Directory
- **`cmd/`**: Entry point for the application.
  - `memos/main.go`: The main CLI entry point using Cobra.
- **`server/`**: Core backend logic.
  - `server.go`: Initializes the Echo web server, registers routes, and manages background runners.
  - `router/`: Contains sub-routers for API (v1), Frontend (static files), FileServer (uploads), and RSS.
- **`store/`**: Database abstraction layer handling interactions with SQLite (default), MySQL, or PostgreSQL.
- **`web/`**: The frontend application.
  - A modern React application built with Vite.
- **`internal/`**: Private application code (Profile configuration, versioning, etc.).
- **`proto/`**: Protocol Buffer definitions and generated code for gRPC.

### Infrastructure Files
- **`Dockerfile`**: Multi-stage build (Frontend -> Backend -> Final Alpine image).
- **`docker-compose.yml`**: Defines the `memos` service for local or production deployment.
- **`Jenkinsfile`**: CI/CD pipeline definition for building and deploying to GitHub Container Registry (GHCR).
- **`go.mod` / `go.sum`**: Go dependency management.

## 3. Architecture & Data Flow

### Backend (Go)
1.  **Startup (`cmd/memos/main.go`)**:
    -   Reads configuration (flags/env) using Viper.
    -   Initializes the `Profile` (settings).
    -   Connects to the database via `db.NewDBDriver`.
    -   Runs database migrations (`storeInstance.Migrate`).
    -   Starts the Server (`server.NewServer`).

2.  **Server (`server/server.go`)**:
    -   Uses **Echo** as the HTTP web framework.
    -   **Frontend Serving**: Embeds the built frontend assets (`dist`) into the binary and serves them via `server/router/frontend`. Uses `embed.FS`.
    -   **API Handling**:
        -   **gRPC Gateway**: Main API logic resides in `server/router/api/v1` and is exposed via gRPC-Gateway, allowing JSON/HTTP access to gRPC services.
        -   **File Server**: Dedicated route for handling file uploads/downloads directly (handling Range requests particularly for media).
        -   **RSS**: Generates RSS feeds for public memos.
    -   **Background Runners**: Handles tasks like S3 presigning asynchronously.

### Frontend (React + TypeScript)
1.  **Entry Point (`web/src/main.tsx`)**:
    -   Initializes **MobX** stores (`instance`, `user`).
    -   Sets up Routing (`react-router-dom`).
    -   Renders the React app.
2.  **API Communication**:
    -   Uses **gRPC-Web** (via Connect-ES or similar) to communicate with the backend.
    -   `web/src/grpcweb.ts` likely configures the transport.
3.  **State Management**:
    -   MobX is used for reactive state management (User session, Global settings).

## 4. Technology Stack

-   **Backend**: Go 1.25+, Echo (Web Framework), gRPC & Protobuf, SQLite (Embedded DB).
-   **Frontend**: TypeScript, React, Vite, TailwindCSS (v4), MobX, Radix UI.
-   **Infrastructure**: Docker, Jenkins (CI/CD).

## 5. Deployment Flow (CI/CD)

The `Jenkinsfile` defines the automation:
1.  **Pull Source**: Fetches latest code.
2.  **Login**: Authenticates with GHCR.
3.  **Build & Push**:
    -   Checks if image exists.
    -   Builds Docker image (using `Dockerfile`).
    -   Tags with git commit hash and `latest`.
    -   Pushes to registry.
4.  **Deploy**:
    -   Pulls the new image.
    -   Uses `docker-compose` to restart the service with the new image.
    -   Cleans up old images.
