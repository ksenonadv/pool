import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../modules/shared.module';
import { AuthService } from '../../../services/auth.service';
import { NotificationsService } from '../../../services/notifications.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [SharedModule]
})
export class RegisterComponent {
  
  private formBuilder: FormBuilder = inject(FormBuilder);
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  private notificationService: NotificationsService = inject(NotificationsService);

  public registerForm: FormGroup = this.formBuilder.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
  }, { validators: this.checkPasswords.bind(this) });

  public onSubmit(): void {
    
    if (!this.registerForm.valid)
      return;

    this.authService.register({
      username: this.registerForm.value.username,
      password: this.registerForm.value.password,
    }).subscribe({
      next: () => {
        
        this.notificationService.success(
          'Registration', 
          `You are now registered!`
        );

        this.router.navigate(['/']);
      },
      error: (error) => {
        this.notificationService.error(
          'Registration failed', 
          error.message
        );
      },
    });
  }

  private checkPasswords(group: FormGroup) {

    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

}
