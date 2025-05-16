import { DestroyRef, inject, Injectable } from "@angular/core";

import { AuthService } from "./auth.service";
import { HttpClient } from "@angular/common/http";

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Subject } from "rxjs";
import { Me } from "../interfaces/me";
import { environment } from "../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private readonly auth: AuthService = inject(AuthService);
    private readonly http: HttpClient = inject(HttpClient);
    private readonly destroyRef = inject(DestroyRef);
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
                this.http.get<Me>(`${environment.apiUrl}/user/me`).subscribe((user) => {
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
        
            this.http.patch<{ avatar: string; }>(`${environment.apiUrl}/user/avatar`, { avatar }).subscribe({
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
        
            this.http.patch<{ username: string; }>(`${environment.apiUrl}/user/username`, { username }).subscribe({
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
        
            this.http.patch(`${environment.apiUrl}/user/password`, { currentPassword, password }).subscribe({
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