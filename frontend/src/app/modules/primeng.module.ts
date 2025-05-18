import { NgModule } from '@angular/core';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

@NgModule({
  imports: [
    DynamicDialogModule,
    ButtonModule,
    ToastModule
  ],
  exports: [
    DynamicDialogModule,
    ButtonModule,
    ToastModule
  ]
})
export class PrimeNgModule { }
