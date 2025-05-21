# Shared Type Definitions

This directory contains shared TypeScript type definitions used by both the frontend and backend applications. These shared types ensure type safety and consistency across the entire application.

## Key Type Definitions

### Game Types

- **BallGroup**: Enum defining ball groups (solids/stripes)
- **Ball**: Interface for ball positions and properties
- **CueData**: Interface for cue position and power

### Socket Types

- **SocketEvent**: Enum of socket event types for client-server communication
- **ServerEvent**: Enum of server-initiated game events
- **ClientGameEvent**: Enum of client-initiated game events
- **Various event data types**: Type definitions for event payloads

### Statistics Types

- **UserStats**: Interface for user statistics
- **MatchHistory**: Interface for match records
- **PlayerRankingsResult**: Interface for leaderboard data

### Cue Types

- **Cue**: Interface for cue properties
- **CueShopResponse**: Interface for cue shop data

## Documentation

All types are documented using TSDoc comments.
