import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../modules/shared.module';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationsService } from '../../../services/notifications.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [SharedModule]
})
export class LoginComponent {

  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly authService: AuthService = inject(AuthService);

  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly route: Router = inject(Router);

  public loginForm: FormGroup = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  public onSubmit(): void {
    
    if (!this.loginForm.valid)
      return;

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.notifications.success('Login', 'You are now logged in.');
        this.route.navigate(['/home']);
      },
      error: err => {
        this.notifications.error('Login', err.message);
      },
    });

  }

  public loginWithDiscord(): void {
    this.authService.discordLogin();
  }
}
