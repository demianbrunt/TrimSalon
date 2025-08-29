import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbComponent } from './core/components/breadcrumb/breadcrumb.component';
import { SubNavComponent } from './core/components/sub-nav/sub-nav.component';
import { TopNavComponent } from './core/components/top-nav/top-nav.component';
import { AuthenticationService } from './core/services/authentication.service';
import { MobileService } from './core/services/mobile.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    BreadcrumbComponent,
    SubNavComponent,
    TopNavComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <p-toast
      [class]="isMobile ? 'px-5 pb-4' : ''"
      [position]="isMobile ? 'bottom-center' : 'top-right'"
      [preventOpenDuplicates]="true"
    ></p-toast>

    <p-confirmDialog></p-confirmDialog>
    <div class="flex flex-column" style="height: 100dvh">
      @if (authService.isLoggedIn$ | async) {
        <app-top-nav></app-top-nav>
        <app-breadcrumb></app-breadcrumb>
      }
      <div class="flex-grow-1" style="overflow: auto">
        <router-outlet></router-outlet>
      </div>
      @if (authService.isLoggedIn$ | async) {
        <app-sub-nav></app-sub-nav>
      }
    </div>
  `,
})
export class App {
  readonly authService = inject(AuthenticationService);
  readonly MobileService = inject(MobileService);

  get isMobile() {
    return this.MobileService.isMobile;
  }
}
