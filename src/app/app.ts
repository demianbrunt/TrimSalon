import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbComponent } from './core/components/breadcrumb/breadcrumb.component';
import { SubNavComponent } from './core/components/sub-nav/sub-nav.component';
import { TopNavComponent } from './core/components/top-nav/top-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    BreadcrumbComponent,
    SubNavComponent,
    TopNavComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <div class="flex flex-column" style="height: 100dvh">
      <app-top-nav></app-top-nav>

      <app-breadcrumb></app-breadcrumb>

      <div class="flex-grow-1" style="overflow: auto">
        <router-outlet></router-outlet>
      </div>

      <app-sub-nav></app-sub-nav>
    </div>
  `,
})
export class App {}
