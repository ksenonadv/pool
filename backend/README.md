# Cue Frenzy Backend

This project is a backend server for a pool game, built using the Node.js framework. 
It provides RESTful APIs for managing game sessions, player interactions, and real-time gameplay features using Websockets. 
The backend is designed for scalability and easy integration with various frontend clients.

## API Documentation

The codebase is thoroughly documented using TSDoc comments. These comments provide detailed information about:

- Controllers and their endpoints
- Services and their business logic
- Entity relationships and data structures
- DTO validations and requirements
- Authentication flows

The documentation is generated using TypeDoc.

## Key Components

### Controllers

- **AuthController**: Handles authentication operations (login, signup, token refresh)
- **UserController**: Manages user profile operations
- **StatsController**: Provides endpoints for game statistics and player rankings
- **CueController**: Handles cue shop and cue equipping functionality

### Services

- **AuthService**: Implements authentication business logic
- **UsersService**: Manages user-related operations
- **StatsService**: Tracks and calculates player statistics
- **CueService**: Handles cue-related business logic

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```