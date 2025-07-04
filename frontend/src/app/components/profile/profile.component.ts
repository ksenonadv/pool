import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationsService } from '../../services/notifications.service';
import { SharedModule } from '../../modules/shared.module';
import { UserService } from '../../services/user.service';
import { StatsComponent } from "./stats/stats.component";

/**
 * Component for displaying and managing user profile information.
 * 
 * Provides functionality to:
 * - Update username
 * - Change password
 * - Upload and update avatar image
 * - View player statistics (via StatsComponent)
 */
@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    imports: [SharedModule, StatsComponent],
    standalone: true
})
export class ProfileComponent {

    private readonly notifications: NotificationsService = inject(NotificationsService);
    private readonly userService: UserService = inject(UserService);
    private readonly formBuilder: FormBuilder = inject(FormBuilder);

    /**
     * Form group for changing username with validation
     */
    public usernameChangeForm: FormGroup = this.formBuilder.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
    });

    /**
     * Form group for changing password with validation including password matching
     */
    public passwordChangeForm: FormGroup = this.formBuilder.group({
        currentPassword: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    }, { validators: this.checkPasswords.bind(this) });

    /**
     * URL of the user's avatar image
     */
    public avatar: string = '';
    
    /**
     * Flag to hide password change form for OAuth users
     */
    public hideChangePassword: boolean = false;
    
    /**
     * Flag to track loading states during API calls
     */
    public loading: boolean = false;
    
    /**
     * Initialize component and subscribe to user data
     */
    constructor() {
        this.userService.user$.subscribe((user) => {
            if (user) {
                this.usernameChangeForm.patchValue({
                    username: user.username
                });

                this.avatar = user.avatar;
                this.hideChangePassword = user.discordId ? true : false;
            }
        });
    }

    /**
     * Change the user's username if form is valid
     */
    public changeUsername(): void {

        if (this.usernameChangeForm.invalid || !this.usernameChangeForm.touched)
            return;

        const { username } = this.usernameChangeForm.value;

        this.loading = true;

        this.userService.updateUsername(username).then(() => {
            
            this.notifications.success(
                'Username Update', 
                'Your username has been updated successfully.'
            );

            this.loading = true;

        }).catch((error) => {
            
            this.notifications.error(
                'Username Update', 
                error
            );

            this.loading = false;
        });
    }

    /**
     * Change the user's password if form is valid
     */
    public changePassword(): void {

        if (this.passwordChangeForm.invalid || !this.passwordChangeForm.touched)
            return;

        const { 
            currentPassword, 
            password 
        } = this.passwordChangeForm.value;

        this.loading = true;

        this.userService.updatePassword(currentPassword, password).then(() => {
            this.notifications.success(
                'Password Update', 
                'Your password has been updated successfully.'
            );

            this.loading = false;

        }).catch((error) => {

            this.notifications.error(
                'Password Update', 
                error
            );

            this.loading = false;
        });
    }

    /**
     * Validate that password and confirm password fields match
     * 
     * @param group - FormGroup containing password fields
     * @returns Validation error object or null if valid
     */
    private checkPasswords(group: FormGroup) {

        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        
        if (password !== confirmPassword) {
            group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        }
        
        return null;
    }

    /**
     * Handle avatar image upload and update
     * 
     * @param event - File input change event containing the selected image
     */
    public changeAvatar(event: Event): void {
        
        const target = event.target as HTMLInputElement;
        
        if (!target.files || target.files.length === 0) 
            return;
        
        const file = target.files[0];

        if (!file) 
            return;
        
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
            
            const base64 = (reader.result as string).replace(/^data:image\/[a-z]+;base64,/, '');

            this.loading = true;

            this.userService.updateAvatar(base64).then(() => {
                
                this.notifications.success(
                    'Image Update', 
                    'Your avatar has been updated successfully.'
                );

                this.loading = false;

            }).catch((error) => {
                
                this.notifications.error(
                    'Image Update', 
                    error
                );

                this.loading = false;
            });
        };
    }

}
