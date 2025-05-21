import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { CueShopResponse } from '@shared/cue.types';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class CueService {

  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly apiUrl = `${this.config.apiUrl}/cues`;

  constructor() { }

  /**
   * Load the cue shop data
   */
  public getCueShopData(): Observable<CueShopResponse> {
    return this.http.get<CueShopResponse>(
      `${this.apiUrl}/shop`
    );
  }

  /**
   * Equip a cue
   */
  public equipCue(cueId: string): Observable<void | HttpErrorResponse> {
    return this.http.patch<void | HttpErrorResponse>(
      `${this.apiUrl}/equip/${cueId}`, 
      {}
    );
  }
}
