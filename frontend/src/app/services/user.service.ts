import { DestroyRef, inject, Injectable } from "@angular/core";

import { AuthService } from "./auth.service";
import { HttpClient } from "@angular/common/http";

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from "rxjs";
import { Me } from "../interfaces/me";
import { ConfigService } from "./config.service";

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

    public get user$() {
        return this.user.asObservable();
    }

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