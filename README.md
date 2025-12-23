# slowfall — README

This repository contains the slowfall backend and frontend. This is a school project, the final one to prove ability
to build something on our own with potential to be a real application.

## Overview

slowfall is a Java Spring Boot backend with a TypeScript/React frontend. slowfall is meant to help skydiver
organizations handle manifests.

## Development Setup

### Prerequisites

- **Java 21** (Eclipse Temurin or similar)
- **Node.js 20** (LTS recommended)
- **Docker** and **Docker Compose** (for containerized development)
- **Git**

### Shell Setup (Optional)

If you prefer using **zsh** as your default shell, you can set it up properly:

1. First, verify zsh is installed:
   ```bash
   zsh --version
   ```

2. Find the zsh binary path:
   ```bash
   which zsh
   ```

3. Set zsh as your default shell using the **full path**:
   ```bash
   chsh -s $(which zsh)
   ```
   
   Or alternatively, use the absolute path directly:
   ```bash
   chsh -s /usr/bin/zsh
   ```

   **Note:** Do NOT use `chsh -s $zsh` as this uses an undefined variable. The correct approach is to use command substitution `$(which zsh)` or provide the absolute path to the zsh binary.

4. Log out and log back in for the changes to take effect.

### Building and Running

#### Using Docker Compose

```bash
cd docker
docker-compose -f docker-compose-dev.yml up --build
```

#### Local Development

**Backend:**
```bash
./gradlew bootRun
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

