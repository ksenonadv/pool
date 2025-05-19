import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SharedModule } from 'primeng/api';
import { ConnectionState } from 'src/app/interfaces/connection-state';
import { ChatComponent } from './chat/chat.component';
import { GameComponent } from './game/game.component';
import { PoolSocketService } from 'src/app/services/pool-socket.service';

@Component({
  selector: 'app-play',
  imports: [SharedModule, ChatComponent, GameComponent],
  providers: [PoolSocketService],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent {
  
  private readonly poolService: PoolSocketService = inject(PoolSocketService);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  public state: ConnectionState = ConnectionState.Disconnected;

  constructor() {
    this.poolService.state$().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((state) => {
      this.state = state;
    });
  }

}
