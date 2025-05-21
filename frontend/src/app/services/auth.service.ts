import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, tap, throwError, of } from 'rxjs';
import { ConfigService } from './config.service';

/**
 * Response object from authentication API endpoints.
 */
export interface AuthResponse {
  /** JWT access token used for API authorization */
  accessToken: string;
  
  /** JWT refresh token used for getting new access tokens */
  refreshToken: string;
}

/**
 * Service handling user authentication operations in the frontend.
 * Manages login, registration, token storage, and authorization state.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly config = inject(ConfigService);

  private apiUrl = this.config.apiUrl + '/auth';

  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  
  /** BehaviorSubject tracking the user's login state */
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasTokens());

  constructor(private http: HttpClient) {}

  /**
   * Registers a new user with the application.
   * 
   * @param data - Object containing username and password
   * @returns Observable of AuthResponse containing the tokens
   */
  register(data: { username: string; password: string; }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, data).pipe(
      tap(res => this.saveTokens(res)),
      tap(() => this.loggedIn$.next(true)),
      catchError(this.handleError)
    );
  }

  /**
   * Authenticates a user with username and password.
   * 
   * @param data - Object containing username and password
   * @returns Observable of AuthResponse containing the tokens
   */
  login(data: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, data).pipe(
      tap(res => this.saveTokens(res)),
      tap(() => this.loggedIn$.next(true)),
      catchError(this.handleError)
    );
  }

  /**
   * Refreshes authentication tokens using the stored refresh token.
   * 
   * @returns Observable of AuthResponse containing new tokens or null if refresh fails
   */
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

  /**
   * Logs out the current user by clearing tokens and updating login state.
   */
  logout(): void {
    this.clearTokens();
    this.loggedIn$.next(false);
  }

  /**
   * Provides an observable of the user's login state.
   * 
   * @returns Observable boolean indicating if the user is logged in
   */
  isLoggedIn(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  /**
   * Retrieves the stored access token.
   * 
   * @returns The access token or null if not available
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  /**
   * Retrieves the stored refresh token.
   * 
   * @returns The refresh token or null if not available
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Saves authentication tokens to local storage.
   * 
   * @param res - Object containing access and refresh tokens
   */
  private saveTokens(res: AuthResponse) {
    localStorage.setItem(this.accessTokenKey, res.accessToken);
    localStorage.setItem(this.refreshTokenKey, res.refreshToken);
  }

  /**
   * Clears authentication tokens from local storage.
   */
  private clearTokens() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Checks if authentication tokens exist in local storage.
   * 
   * @returns Boolean indicating if both tokens are present
   */
  private hasTokens(): boolean {
    return !!localStorage.getItem(this.accessTokenKey) && !!localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Handles HTTP errors from authentication requests.
   * 
   * @param error - The HTTP error response
   * @returns An observable that throws the error
   */
  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.error || 'Server error');
  }

  /**
   * Initiates Discord OAuth login flow by redirecting to the Discord auth endpoint.
   */
  public discordLogin(): void {
    window.location.href = `${this.apiUrl}/discord`;
  }

  /**
   * Handles OAuth callback by saving the provided tokens and updating login state.
   * 
   * @param accessToken - The access token from the OAuth provider
   * @param refreshToken - The refresh token from the OAuth provider
   */
  public handleAuthCallback(accessToken: string, refreshToken: string): void {
    this.saveTokens({ accessToken, refreshToken });
    this.loggedIn$.next(true);
  }
}
