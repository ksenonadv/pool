import { Component } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared.module';

@Component({
  selector: 'app-home',
  imports: [SharedModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent { }
