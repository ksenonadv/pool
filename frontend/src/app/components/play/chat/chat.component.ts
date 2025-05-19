import { Component, DestroyRef, ElementRef, inject, Input, OnChanges, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatMessage } from '@shared/socket.types';
import { ConnectionState } from 'src/app/interfaces/connection-state';
import { SharedModule } from 'src/app/modules/shared.module';
import { PoolSocketService } from 'src/app/services/pool-socket.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-chat',
  imports: [SharedModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnChanges {

  private readonly service: PoolSocketService = inject(PoolSocketService);
  private readonly userService: UserService = inject(UserService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  
  @Input()
  public state: ConnectionState = ConnectionState.Disconnected;

  @ViewChild('scrollContainer', { static: false })
  public scrollContainer: ElementRef<HTMLDivElement> = undefined!;

  @ViewChildren('chatMessages')
  public chatMessages: QueryList<any> = undefined!;

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

  ngAfterViewInit(): void {
    this.chatMessages.changes.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.scrollToBottom();
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['state'] && changes['state'].previousValue == ConnectionState.InGame && changes['state'].currentValue == ConnectionState.InWaitingRoom) {
      this.messages = [];
    }
  }

  private scrollToBottom() {
    
    if (!this.scrollContainer)
      return;

    this.scrollContainer.nativeElement.scroll({
      top: this.scrollContainer.nativeElement.scrollHeight,
      left: 0
    });

  }

}
