import { inject, Injectable, OnDestroy, OnInit } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { ChatMessage, ClientGameEvent, ClientGameEventData, ConnectionStateEventData, ShootEventData, SocketEvent } from "@shared/socket.types";
import { BehaviorSubject, Subject } from "rxjs";
import { ConnectionState } from "../interfaces/connection-state";

@Injectable()
export class PoolService implements OnDestroy {

  private readonly socket: Socket = inject(
    Socket
  );

  private state: BehaviorSubject<ConnectionState> = new BehaviorSubject<ConnectionState>(
    ConnectionState.Disconnected
  );

  private messages: Subject<ChatMessage> = new Subject<ChatMessage>();

  constructor() {

    this.socket.once('connect', () => {
      
      this.state.next(
        ConnectionState.Connected
      );
      
      this.socket.emit(
        SocketEvent.JOIN
      );

    });

    this.socket.on('disconnect', () => {
      this.state.next(
        ConnectionState.Disconnected
      );

      // Attempt to reconnect.
      this.socket.connect();
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
      this.messages.next(
        message
      );
    });

    if (!this.socket.connected)
      this.socket.connect();
  }

  ngOnDestroy() {

    if (!this.socket.connected)
      return;

    this.socket.disconnect();
  }

  public state$() {
    return this.state.asObservable();
  }

  public messages$() {
    return this.messages.asObservable();
  }

  public sendChatMessage(text: string) {
    this.socket.emit(
      SocketEvent.CHAT_MESSAGE,
      text
    );
  }

  public sendGameEvent(event: ClientGameEvent, data: ClientGameEventData['data']) {
    this.socket.emit(
      SocketEvent.CLIENT_GAME_EVENT,
      {
        event,
        data
      }
    );
  }

  public fromEvent<T, SocketEvent extends string>(event: SocketEvent) {
    return this.socket.fromEvent<T, SocketEvent>(
      event
    );
  }


}