import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { SetPlayersEventData } from '@shared/socket.types';
import { SharedModule } from 'src/app/modules/shared.module';

@Component({
  selector: 'app-players',
  imports: [SharedModule],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss'
})
export class PlayersComponent implements OnChanges {

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

  public isPlayerTurn: Array<boolean> = [false, false];

  public ngOnChanges(changes: SimpleChanges): void {
    
    if (changes['canShoot'] && this.players) {

      const myIndex = this.players.findIndex(
        p => p.userId === this.userId
      );

      if (myIndex === -1)
        return;

      this.isPlayerTurn[myIndex] = changes['canShoot'].currentValue;
      this.isPlayerTurn[1 - myIndex] = !changes['canShoot'].currentValue;
    }

  }
}

