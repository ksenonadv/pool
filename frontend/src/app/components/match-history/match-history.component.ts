import { Component, OnInit, inject } from '@angular/core';
import { MatchHistoryResult } from '@shared/stats.types';
import { StatsService } from 'src/app/services/stats.service';
import { SharedModule } from 'src/app/modules/shared.module';
import { MatchComponent } from './match/match.component';

@Component({
  selector: 'app-match-history',
  imports: [SharedModule, MatchComponent],
  templateUrl: './match-history.component.html',
  styleUrl: './match-history.component.scss',
  standalone: true
})
export class MatchHistoryComponent implements OnInit {

  private readonly statsService: StatsService = inject(StatsService);
  
  public history: MatchHistoryResult = {
    matches: [],
    total: 0,
    page: 1,
    totalPages: 0
  };
  
  public loading = true;
  public first = 0;
  public rows = 10;

  ngOnInit(): void {
    this.loadHistory();
  }

  public loadHistory(page: number = 1): void {
    this.statsService.getHistory(page, this.rows).subscribe({
      next: (result) => {
        this.history = result;
      }
    });
  }

  public onPageChange(event: any): void {
    
    this.first = event.first;
    this.rows = event.rows;

    const page = Math.floor(
      event.first / event.rows
    ) + 1;
    
    this.loadHistory(
      page
    );
  }
}
