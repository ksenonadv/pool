import { Component, Input } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared.module';

@Component({
  selector: 'app-player-rank-item',
  templateUrl: './player-rank-item.component.html',
  styleUrl: './player-rank-item.component.scss',
  imports: [SharedModule],
  standalone: true
})
export class PlayerRankItem {
  @Input() player: any;
  @Input() rank: number = 0;
}
