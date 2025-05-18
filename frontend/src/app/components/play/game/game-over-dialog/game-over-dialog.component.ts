import { Component, OnInit } from '@angular/core';
import { GameOverReason, NameAndAvatar } from '@shared/socket.types';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SharedModule } from 'src/app/modules/shared.module';

@Component({
  selector: 'app-game-over-dialog',
  templateUrl: './game-over-dialog.component.html',
  imports: [SharedModule],
})
export class GameOverDialogComponent implements OnInit {
 
  public reason: GameOverReason = undefined!;
  public player: NameAndAvatar = undefined!;
  public duration: number = 0;
 
  constructor(
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
  ) { }

  ngOnInit(): void {

    if (!this.config.data)
      return;

    this.reason = this.config.data.reason;
    this.player = this.config.data.player;
    this.duration = this.config.data.duration;
  }

  public close(): void {
    this.ref.close();
  }
}
