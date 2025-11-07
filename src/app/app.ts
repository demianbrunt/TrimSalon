import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
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
    ConfirmDialog,
    ToastModule,
    BreadcrumbComponent,
    SubNavComponent,
    TopNavComponent,
    ConfirmDialogModule,
  ],
  template: `
    <p-confirmDialog />
    <p-toast
      [class]="isMobile ? 'px-5 pb-4' : ''"
      [position]="isMobile ? 'bottom-center' : 'top-right'"
      [preventOpenDuplicates]="true"
    />

    @if (authService.isAuthenticated()) {
      <app-sub-nav></app-sub-nav>
    }
    <div class="main-container">
      @if (authService.isAuthenticated()) {
        <app-top-nav></app-top-nav>
        <app-breadcrumb></app-breadcrumb>
      }
      <div class="content-outlet">
        <router-outlet></router-outlet>
      </div>
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
