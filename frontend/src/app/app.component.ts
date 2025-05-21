import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast'
import { NavbarComponent } from "./components/navbar/navbar.component";
import { FooterComponent } from "./components/footer/footer.component";
import { DialogService } from 'primeng/dynamicdialog';
import { DeviceDetectorService } from 'ngx-device-detector';
import { MobileComponent } from './components/mobile/mobile.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, MobileComponent, Toast],
  providers: [DialogService],
  template: `
    <div class="min-h-screen flex flex-col bg-[#041024] font-sans">
      @if (isDesktop) {
        <app-navbar></app-navbar>
        <main class="flex-grow container mx-auto px-4 py-8">
          <router-outlet></router-outlet>
        </main>
        <app-footer></app-footer>
      } @else {
        <app-mobile></app-mobile>
      }
      <p-toast position="bottom-right"></p-toast>
    </div>
  `,
  styleUrl: 'app.component.scss',
})
export class AppComponent { 

  private readonly deviceDetectorService = inject(
    DeviceDetectorService
  );

  public get isDesktop() {
    return this.deviceDetectorService.isDesktop();
  }

}
