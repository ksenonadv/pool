import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Socket } from 'ngx-socket-io';
@Component({
  selector: 'app-play',
  imports: [
    CommonModule
  ],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent {
  
  private readonly socket: Socket = inject(Socket);

  constructor() {
    this.socket.on('connect', () => {
      this.socket.emit(
        'joinWaitingRoom'
      );
    });
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }
}
