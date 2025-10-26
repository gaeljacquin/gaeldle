# Gemini Project Context: Gaeldle

## Project Overview

This is a monorepo for a full-stack web application called "Gaeldle". The project is managed using Nx and consists of a Next.js frontend and an Elysia.js backend. The entire application is containerized using Docker.

*   **Frontend (web):** A Next.js application written in TypeScript. It uses `pnpm` for package management and runs on port 3000. The frontend features a health dashboard for monitoring the API status.
*   **Backend (api):** A REST API built with Elysia.js and Bun. It's written in TypeScript and runs on port 8080. The API includes health check endpoints.
*   **Monorepo:** The project uses Nx to manage the monorepo structure, enabling shared configurations and streamlined development across the frontend and backend.
<!-- *   **Containerization:** The application is fully containerized with Docker and Docker Compose, allowing for a consistent development environment. -->

## Building and Running

The project can be run either using Docker or locally with Nx.

<!-- ### Docker (Recommended)

*   **Start all services:** `pnpm run docker:up`
*   **Stop all services:** `pnpm run docker:down`
*   **Access applications:**
    *   Frontend: http://localhost:3000
    *   API Health: http://localhost:8080/health -->

### Local Development

*   **Start API:** `nx serve api`
*   **Start Frontend:** `nx serve web`

### Testing

*   **Run all tests:** `nx run-many -t test`
*   **Test API:** `nx test api`

## Development Conventions

*   **Commit Messages:** The project follows the Conventional Commits specification. Commits are validated using `commitlint`.
*   **Code Quality:** ESLint is used for code quality and consistency. Pre-commit hooks are in place to enforce standards.
*   **Package Management:** `pnpm` is used for managing dependencies in the workspace.
