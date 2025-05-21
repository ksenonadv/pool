import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { MatchHistoryResult, PlayerRankingsResult, PlayerRankingsSortBy, PlayerRankingsSortOrder, UserStats } from "@shared/stats.types";
import { ConfigService } from "./config.service";

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  private readonly http: HttpClient = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private apiUrl = this.config.apiUrl + '/stats';

  public getStats() {
    return this.http.get<UserStats>(
      `${this.apiUrl}/player`
    );
  }

  public getHistory(page: number = 1, limit: number = 25) {
    return this.http.get<MatchHistoryResult>(
      `${this.apiUrl}/player/history?page=${page}&limit=${limit}`
    );
  }
  public getRankings(
    page: number = 1, 
    limit: number = 25, 
    sortBy: PlayerRankingsSortBy = PlayerRankingsSortBy.winRate, 
    sortOrder: PlayerRankingsSortOrder = PlayerRankingsSortOrder.DESC
  ) {
    return this.http.get<PlayerRankingsResult>(
      `${this.apiUrl}/rankings?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    );
  }

}