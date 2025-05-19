import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, tap, throwError, of } from 'rxjs';
import { ConfigService } from './config.service';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {


  private readonly config = inject(ConfigService);

  private apiUrl = this.config.apiUrl + '/auth';

  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasTokens());

  constructor(private http: HttpClient) {}

  register(data: { username: string; password: string; }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, data).pipe(
      tap(res => this.saveTokens(res)),
      tap(() => this.loggedIn$.next(true)),
      catchError(this.handleError)
    );
  }

  login(data: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, data).pipe(
      tap(res => this.saveTokens(res)),
      tap(() => this.loggedIn$.next(true)),
      catchError(this.handleError)
    );
  }

  refreshTokens(): Observable<AuthResponse | null> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/refresh`, {
      headers: { Authorization: `Bearer ${this.getRefreshToken()}` }
    }).pipe(
      tap(res => this.saveTokens(res)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  logout(): void {
    this.clearTokens();
    this.loggedIn$.next(false);
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  private saveTokens(res: AuthResponse) {
    localStorage.setItem(this.accessTokenKey, res.accessToken);
    localStorage.setItem(this.refreshTokenKey, res.refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  private hasTokens(): boolean {
    return !!localStorage.getItem(this.accessTokenKey) && !!localStorage.getItem(this.refreshTokenKey);
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.error || 'Server error');
  }

  public discordLogin(): void {
    window.location.href = `${this.apiUrl}/discord`;
  }

  public handleAuthCallback(accessToken: string, refreshToken: string): void {
    this.saveTokens({ accessToken, refreshToken });
    this.loggedIn$.next(true);
  }
}
