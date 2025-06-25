# Cue Frenzy

A modern 8-ball pool game web application built with Angular, NestJS framework and Matter.JS library. 

Hosted version available at [https://cue-frenzy.cristea.dev/](https://https://cue-frenzy.cristea.dev/).

## Overview

This project implements a fully functional 8-ball pool game with user authentication, multiplayer capabilities, customization options, and player statistics. 
The application uses a microservices architecture with separate frontend and backend services, all orchestrated with Docker Compose.

## Features

- **Realistic Pool Physics**: Implemented using Matter.js physics engine
- **User Authentication**: Discord integration for easy sign-in
- **Multiplayer Gameplay**: Real-time matches via WebSockets
- **Customization Options**: Unlock different cues with points earned from matches
- **Player Statistics**: Track wins, losses, and other game statistics

## Technology Stack

### Frontend
- **Framework**: Angular 19
- **UI Components**: PrimeNG, Tailwind CSS
- **Socket Communication**: ngx-socket-io
- **Icons**: Font Awesome

### Backend
- **Framework**: NestJS 11
- **Database**: PostgreSQL 17
- **Authentication**: JWT, Passport
- **WebSockets**: Socket.io
- **ORM**: TypeORM

## Project Structure

- **`/frontend`**: Angular application
- **`/backend`**: NestJS server
- **`/shared`**: Common TypeScript types shared between frontend and backend
- **`/docs`**: Documentation generation scripts
- **`/proxy`**: Nginx configuration for the reverse proxy (used by Docker)
- **`/postgres-data`**: Database persistence volume

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)

### Environment Setup

Create a `.env` file in the root directory. An example environment configuration can be found in `.env.example`

### Running the Application

1. Start all services:
   ```
   docker-compose up -d
   ```

2. Access the application:
  http://localhost

### Local Development

#### Frontend
```
cd frontend
npm install
ng serve
```

#### Backend
```
cd backend
npm install
npm run start
```