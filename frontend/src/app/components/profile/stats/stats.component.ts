import { Component, inject } from '@angular/core';
import { UserStats } from '@shared/stats.types';
import { StatsService } from 'src/app/services/stats.service';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { SharedModule } from 'src/app/modules/shared.module';

@Component({
  selector: 'app-stats',
  imports: [SharedModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
  standalone: true
})
export class StatsComponent {

  private readonly statsService: StatsService = inject(StatsService);
  public stats: UserStats = undefined!;

  constructor() {
    this.statsService.getStats().subscribe((stats) => {
      this.stats = stats;
    });
  }
}
