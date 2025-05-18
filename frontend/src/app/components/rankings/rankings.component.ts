import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared.module';
import { StatsService } from 'src/app/services/stats.service';
import { PlayerRankItem } from './player-rank-item/player-rank-item.component';
import { PlayerRankingsResult } from '@shared/stats.types';

@Component({
  selector: 'app-rankings',
  templateUrl: './rankings.component.html',
  styleUrl: './rankings.component.scss',
  imports: [SharedModule, PlayerRankItem],
  standalone: true
})
export class RankingsComponent implements OnInit {
  
  private readonly statsService: StatsService = inject(StatsService);
  
  public rankings: PlayerRankingsResult = undefined!;
  public loading = true;
  public first = 0;
  public rows = 10;

  ngOnInit(): void {
    this.loadRankings();
  }

  public loadRankings(page: number = 1): void {
    
    this.loading = true;
    
    this.statsService.getRankings(page, this.rows).subscribe({
      next: (result) => {
        this.rankings = result;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }

  public onPageChange(event: any): void {
    
    this.first = event.first;
    this.rows = event.rows;
    
    const page = Math.floor(
      event.first / event.rows
    ) + 1;
    
    this.loadRankings(page);
  }
}
