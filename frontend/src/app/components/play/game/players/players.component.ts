import { Component, Input } from '@angular/core';
import { BallGroup } from '@shared/game.types';
import { SetPlayersEventData } from '@shared/socket.types';
import { SharedModule } from 'src/app/modules/shared.module';

@Component({
  selector: 'app-players',
  imports: [SharedModule],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss'
})
export class PlayersComponent {

  @Input()
  public players: SetPlayersEventData | undefined = undefined;

  @Input()
  public userId: string = undefined!;

  @Input()
  public canShoot: boolean = false;

  @Input()
  public solids: Array<number> = [];

  @Input()
  public stripes: Array<number> = [];

  public isPlayerTurn(userId: string): boolean {

    if (this.userId == userId)
      return this.canShoot;

    return !this.canShoot;
  }
}

