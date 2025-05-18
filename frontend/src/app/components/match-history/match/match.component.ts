import { Component, Input } from '@angular/core';
import { MatchHistory } from '@shared/stats.types';
import { SharedModule } from 'src/app/modules/shared.module';

@Component({
  selector: 'app-match',
  imports: [SharedModule],
  templateUrl: './match.component.html',
  styleUrl: './match.component.scss'
})
export class MatchComponent {
  @Input() match: MatchHistory = undefined!;
}
