import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatMessage } from '@shared/socket.types';
import { ConnectionState } from 'src/app/interfaces/connection-state';
import { SharedModule } from 'src/app/modules/shared.module';
import { PoolService } from 'src/app/services/pool.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-chat',
  imports: [SharedModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {

  private readonly service: PoolService = inject(PoolService);
  private readonly userService: UserService = inject(UserService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  
  @Input()
  public state: ConnectionState = ConnectionState.Disconnected;

  public messages: Array<ChatMessage & { my: boolean }> = [];
  public input: string = '';

  private my_name: string = '';

  constructor() {
    this.userService.user$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((user) => {
      
      if (!user)
        return;

      this.my_name = user.username;
    });

    this.service.messages$().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((message) => {
      this.messages.push({
        ...message,
        my: message.name == this.my_name
      });
    });
  }

  public send() {

    if (!this.input)
      return;

    this.service.sendChatMessage(
      this.input
    );

    this.input = '';
  }

  public get canSend(): boolean {
    return this.state == ConnectionState.InGame;
  }

}
