import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast'
import { NavbarComponent } from "./components/navbar/navbar.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, Toast],
  template: `
    <div class="min-h-screen flex flex-col bg-[#041024] font-sans">
      <app-navbar></app-navbar>
      <main class="flex-grow container mx-auto px-4 py-8">
        <router-outlet></router-outlet>
      </main>  
      <p-toast position="bottom-right"></p-toast>
    </div>
  `
})
export class AppComponent { }
