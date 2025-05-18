import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SharedModule } from 'src/app/modules/shared.module';

@Component({
  selector: 'app-game-over-dialog',
  templateUrl: './game-over-dialog.component.html',
  imports: [SharedModule],
})
export class GameOverDialogComponent implements OnInit {
  
  public message: string = undefined!;
  public duration: number = undefined!;

  constructor(
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
  ) { }

  ngOnInit(): void {
    if (this.config.data) {
      this.message = this.config.data.message;
      this.duration = this.config.data.duration;
    }
  }

  public close(): void {
    this.ref.close();
  }
}
