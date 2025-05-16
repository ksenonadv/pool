import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationsService } from '../../../services/notifications.service';

@Component({
    selector: 'app-auth-callback',
    template: '<div class="text-center p-8"><p>Processing authentication...</p></div>',
})
export class AuthCallbackComponent implements OnInit {

    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    private readonly router: Router = inject(Router);
    private readonly authService: AuthService = inject(AuthService);
    private readonly notifications: NotificationsService = inject(NotificationsService);

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {

            const accessToken = params['access_token'];
            const refreshToken = params['refresh_token'];

            if (accessToken && refreshToken) {
                this.authService.handleAuthCallback(accessToken, refreshToken);
                this.notifications.success('Login', 'Successfully logged in with Discord');
                this.router.navigate(['/play']);
            } else {
                this.notifications.error('Login', 'Authentication failed');
                this.router.navigate(['/login']);
            }
        });
    }
}
