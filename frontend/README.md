# Cue Frenzy Frontend

This project is a web-based pool game built with Angular. It provides an interactive user interface for playing pool, featuring real-time gameplay, responsive design, and smooth animations.

## Documentation

The frontend codebase is thoroughly documented using TSDoc comments. These comments provide detailed information about:

- Components and their responsibilities
- Services and their functionality
- Interfaces and type definitions
- State management and data flow
- Socket communication with the backend

The documentation is generated using TypeDoc.

## Key Components

### Game Components

- **GameComponent**: Main component for rendering the pool game
- **PlayersComponent**: Displays player information during a game
- **GameOverDialogComponent**: Shown when a game concludes

### Services

- **GameStateService**: Manages the game state and communicates with the server
- **PoolSocketService**: Handles WebSocket communication for real-time gameplay
- **PoolRendererService**: Renders the game visuals on the canvas
- **PoolAudioService**: Manages game audio and sound effects
- **AuthService**: Handles user authentication and token management

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. 
The application will automatically reload whenever you modify any of the source files.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. 
By default, the production build optimizes the application for performance and speed.