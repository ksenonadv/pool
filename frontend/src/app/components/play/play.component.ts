import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SharedModule } from 'primeng/api';
import { ConnectionState } from 'src/app/interfaces/connection-state';
import { ChatComponent } from './chat/chat.component';
import { GameComponent } from './game/game.component';
import { PoolSocketService } from 'src/app/services/pool-socket.service';
import { Router } from '@angular/router';

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
  private readonly router = inject(Router);

  public state: ConnectionState = ConnectionState.Disconnected;

  constructor() {
    this.poolService.state$().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((state) => {
      
      if (this.state > ConnectionState.Error && (state == ConnectionState.Disconnected || state == ConnectionState.Error))
        this.router.navigate(['/']);

      this.state = state;

    });
  }

}
