import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

import { MatchHistoryResult, UserStats } from "@shared/stats.types";

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  private readonly http: HttpClient = inject(HttpClient);

  public getStats() {
    return this.http.get<UserStats>(
      `${environment.apiUrl}/stats/player`
    );
  }

  public getHistory(page: number = 1, limit: number = 25) {
    return this.http.get<MatchHistoryResult>(
      `${environment.apiUrl}/stats/player/history?page=${page}&limit=${limit}`
    );
  }

}