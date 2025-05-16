import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { UserService } from '../../services/user.service';
import { Me } from '../../interfaces/me';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../modules/shared.module'

@Component({
  selector: 'app-navbar',
  imports: [SharedModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  private readonly auth: AuthService = inject(AuthService);
  private readonly userService: UserService = inject(UserService);
  private readonly router: Router = inject(Router);

  public user: Me | undefined = undefined;
  public isDropdownOpen: boolean = false;

  constructor() {
    this.userService.user$.subscribe((user) => {
      this.user = user;
      this.isDropdownOpen = false;
    });
  }

  public logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  public toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

}
