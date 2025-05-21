import { inject, Injectable, OnDestroy, OnInit } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { ChatMessage, ClientGameEvent, ClientGameEventData, ConnectionStateEventData, ShootEventData, SocketEvent } from "@shared/socket.types";
import { BehaviorSubject, Subject } from "rxjs";
import { ConnectionState } from "../interfaces/connection-state";
import { GameSocket } from "../app.socket.config";

/**
 * Service responsible for WebSocket communication between the frontend and backend.
 * Handles connection state, game events, and chat messages.
 */
@Injectable()
export class PoolSocketService implements OnDestroy {

  private readonly socket: Socket = inject(
    GameSocket
  );

  private state: BehaviorSubject<ConnectionState> = new BehaviorSubject<ConnectionState>(
    ConnectionState.Disconnected
  );

  private messages: Subject<ChatMessage> = new Subject<ChatMessage>();

  /**
   * Initializes the socket service and sets up event listeners.
   * Handles socket connection, disconnection, and error events.
   */
  constructor() {
    
    this.socket.on('connect', () => {
      this.state.next(ConnectionState.Connected);
      this.socket.emit(SocketEvent.JOIN);
    });

    this.socket.on('disconnect', () => {
      this.state.next(
        ConnectionState.Disconnected
      );
    });

    this.socket.on('error', () => {
      this.state.next(
        ConnectionState.Error
      );
    });

    this.socket.fromEvent(SocketEvent.SET_CONNECTION_STATE).subscribe((state: ConnectionStateEventData) => {
      this.state.next(
        state == ConnectionStateEventData.InGame ? ConnectionState.InGame : ConnectionState.InWaitingRoom
      );
    });

    this.socket.fromEvent(SocketEvent.CHAT_MESSAGE).subscribe((message: ChatMessage) => {
      this.messages.next(message);
    });

    if (!this.socket.connected)
      this.socket.connect();
  }
  /**
   * Cleans up resources when the service is destroyed.
   * Disconnects from the socket if connected.
   */
  ngOnDestroy() {
    if (this.socket.connected)
      this.socket.disconnect();
  }

  /**
   * Gets an observable of the current connection state.
   * 
   * @returns Observable of the connection state
   */
  public state$() {
    return this.state.asObservable();
  }

  /**
   * Gets an observable of chat messages.
   * 
   * @returns Observable of chat messages
   */
  public messages$() {
    return this.messages.asObservable();
  }

  /**
   * Sends a chat message to all players.
   * 
   * @param text - The message text to send
   */
  public sendChatMessage(text: string) {
    this.socket.emit(
      SocketEvent.CHAT_MESSAGE,
      text
    );
  }

  /**
   * Sends a game event to the server.
   * 
   * @param event - The type of game event
   * @param data - The data associated with the event
   */
  public sendGameEvent(event: ClientGameEvent, data: ClientGameEventData['data']) {
    this.socket.emit(
      SocketEvent.CLIENT_GAME_EVENT,
      {
        event,
        data
      }
    );
  }

  /**
   * Creates an observable for a specific socket event.
   * 
   * @param event - The socket event to listen for
   * @returns Observable that emits when the event occurs
   */
  public fromEvent<T, SocketEvent extends string>(event: SocketEvent) {
    return this.socket.fromEvent<T, SocketEvent>(
      event
    );
  }


}