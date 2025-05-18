import { NgModule } from '@angular/core';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';

@NgModule({
  imports: [
    DynamicDialogModule,
    ButtonModule,
    ToastModule,
    PaginatorModule
  ],
  exports: [
    DynamicDialogModule,
    ButtonModule,
    ToastModule,
    PaginatorModule
  ]
})
export class PrimeNgModule { }
