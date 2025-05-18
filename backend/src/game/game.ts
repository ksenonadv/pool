import { Socket } from "socket.io";
import { ClientGameEventData } from "@shared/socket.types";
import { Observable } from "rxjs";

// Import our services and interfaces
import { IGamePlayer } from "./interfaces/game-player.interface";
import { GameStateService } from "./services/game-state.service";
import { PhysicsService } from "./services/physics.service";
import { CommunicationService } from "./services/communication.service";
import { RulesService } from "./services/rules.service";
import { GameStateManagerService } from "./services/game-state-manager.service";

/**
 * Main Game class that coordinates all aspects of the pool game
 */
export class Game {
  /**
   * Creates a new game instance
   * @param players The two players in the game
   * @param gameStateService The game state service
   * @param communicationService The communication service
   * @param physicsService The physics service
   * @param rulesService The rules service
   * @param gameStateManagerService The state manager service
   */
  constructor(
    private readonly players: [IGamePlayer, IGamePlayer],
    private readonly gameStateService: GameStateService,
    private readonly communicationService: CommunicationService,
    private readonly physicsService: PhysicsService,
    private readonly rulesService: RulesService,
    private readonly gameStateManagerService: GameStateManagerService
  ) {
    this.initialize();
  }

  /**
   * Initialize the game
   */
  private initialize(): void {
    
    // Initialize game state with players
    this.gameStateService.initialize(this.players);
    
    // Initialize state manager (which initializes physics)
    this.gameStateManagerService.initialize();
    
    // Start the game
    this.startGame();

    this.gameStateManagerService.end$.subscribe(() => {
      this.cleanup();
    });
  }

  /**
   * Gets the game ID
   */
  public get id(): string {
    return this.gameStateService.id;
  }
  /**
   * Starts the game
   */
  private startGame(): void {
    this.communicationService.notifyGameStart();
    this.rulesService.setTurn(this.gameStateService.activePlayer);
  }

  /**
   * Processes events from clients
   */
  public processEvent(
    sender: Socket,
    event: ClientGameEventData['event'],
    data: ClientGameEventData['data']
  ): void {
    this.gameStateManagerService.processEvent(sender, event, data);
  }

  /**
   * Handles player disconnection
   */
  public handleDisconnect(socketId: string): void {
    this.gameStateManagerService.handleDisconnect(socketId);
  }
  /**
   * Cleans up resources
   */
  private cleanup(): void {
    // Clean up the physics resources (worker threads)
    this.physicsService.cleanup();
    
    // Clean up the state manager
    this.gameStateManagerService.cleanup();
  }

  /**
   * Observable that emits when the game ends
   */
  public get end$(): Observable<void> {
    return this.gameStateManagerService.end$;
  }
}