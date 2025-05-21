import { DestroyRef, inject, Injectable } from "@angular/core";

import { AuthService } from "./auth.service";
import { HttpClient } from "@angular/common/http";

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from "rxjs";
import { Me } from "../interfaces/me";
import { ConfigService } from "./config.service";

/**
 * Service responsible for user profile management.
 * 
 * Handles fetching user data, updating profile information (avatar, username, password),
 * and keeping the user state in sync across the application.
 */
@Injectable({
    providedIn: 'root'
})
export class UserService {

    private readonly auth: AuthService = inject(AuthService);
    private readonly http: HttpClient = inject(HttpClient);
    private readonly config = inject(ConfigService);
    private readonly destroyRef = inject(DestroyRef);

    private apiUrl = this.config.apiUrl + '/user';
    private user: BehaviorSubject<Me | undefined> = new BehaviorSubject<Me | undefined>(undefined);

    /**
     * Initializes the service and sets up authentication subscription.
     * 
     * When the auth state changes, this will automatically fetch
     * the user profile or clear it depending on login status.
     */
    constructor() {
        this.auth.isLoggedIn().pipe(
            takeUntilDestroyed(
                this.destroyRef
            )
        ).subscribe((logged) => {

            if (!logged) {
                this.user.next(
                    undefined
                );
            } else {
                this.http.get<Me>(`${this.apiUrl}/me`).subscribe((user) => {
                    this.user.next(
                        user
                    );
                });
            }
        });
    }

    /**
     * Observable of the current user profile data.
     * 
     * @returns An observable stream of the user profile, or undefined if not logged in
     */
    public get user$() {
        return this.user.asObservable();
    }

    /**
     * Updates the user's avatar.
     * 
     * @param avatar - Base64 encoded string of the image
     * @returns Promise that resolves when the avatar is updated successfully
     * @throws Error message from the server if update fails
     */
    public updateAvatar(avatar: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
        
            this.http.patch<{ avatar: string; }>(`${this.apiUrl}/avatar`, { avatar }).subscribe({
                next: ({ avatar }) => {
                    this.user.next({
                        ...this.user.getValue()!,
                        avatar
                    });
                    resolve();
                },
                error: (err) => {
                    reject(
                        err.error.message
                    );    
                }
            });
        });
    }

    /**
     * Updates the user's username.
     * 
     * @param username - The new username to set
     * @returns Promise that resolves when the username is updated successfully
     * @throws Error message from the server if update fails
     */
    public updateUsername(username: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
        
            this.http.patch<{ username: string; }>(`${this.apiUrl}/username`, { username }).subscribe({
                next: ({ username }) => {
                    this.user.next({
                        ...this.user.getValue()!,
                        username
                    });
                    resolve();
                },
                error: (err) => {
                    reject(
                        err.error.message
                    );    
                }
            });
        });
    }

    /**
     * Updates the user's password.
     * 
     * @param currentPassword - The current password for verification
     * @param password - The new password to set
     * @returns Promise that resolves when the password is updated successfully
     * @throws Error message from the server if update fails
     */
    public updatePassword(currentPassword: string, password: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
        
            this.http.patch(`${this.apiUrl}/password`, { currentPassword, password }).subscribe({
                next: () => {
                    resolve();
                },
                error: (err) => {
                    reject(
                        err.error.message
                    );    
                }
            });
        });
    }

}