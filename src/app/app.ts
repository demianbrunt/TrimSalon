import {
  animate,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { filter } from 'rxjs';
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
  animations: [
    trigger('routeAnimations', [
      transition(
        '* <=> *',
        [
          query(
            ':enter, :leave',
            [
              style({
                position: 'absolute',
                inset: 0,
                width: '100%',
              }),
            ],
            { optional: true },
          ),
          query(
            ':leave',
            [
              animate(
                '{{duration}} ease-in',
                style({
                  opacity: 0,
                  transform: 'translate3d(0, -4px, 0)',
                }),
              ),
            ],
            { optional: true },
          ),
          query(
            ':enter',
            [
              style({
                opacity: 0,
                transform: 'translate3d(0, 6px, 0)',
              }),
              animate(
                '{{duration}} ease-out',
                // Avoid leaving a `transform` on the routed page element.
                // Some mobile browsers (notably iOS Safari) can break `position: sticky`
                // for descendants when any ancestor remains transformed.
                style({ opacity: 1, transform: 'none', position: 'relative' }),
              ),
            ],
            { optional: true },
          ),
        ],
        { params: { duration: '160ms' } },
      ),
    ]),
  ],
  template: `
    <p-confirmDialog />
    <p-toast
      [class]="isMobile ? 'px-5 pb-4' : ''"
      [position]="isMobile ? 'bottom-center' : 'top-right'"
      [preventOpenDuplicates]="true"
    />

    <a class="sr-only skip-link" href="#app-maincontent"
      >Skip naar hoofdinhoud</a
    >

    <div class="main-container" [class.admin-layout]="showAdminChrome()">
      <app-top-nav></app-top-nav>
      @if (showAdminChrome()) {
        <app-sub-nav></app-sub-nav>
        <app-breadcrumb></app-breadcrumb>
      }
      <div class="content-outlet" id="app-maincontent" tabindex="-1">
        <div
          class="route-animation-host"
          [@routeAnimations]="{
            value: outlet?.isActivated
              ? (outlet.activatedRouteData?.['breadcrumb'] ??
                outlet.activatedRoute.snapshot.routeConfig?.path ??
                '')
              : '',
            params: { duration: routeAnimationDuration },
          }"
        >
          <router-outlet #outlet="outlet"></router-outlet>
        </div>
      </div>
    </div>
  `,
})
export class App {
  readonly authService = inject(AuthenticationService);
  readonly MobileService = inject(MobileService);
  readonly swUpdate = inject(SwUpdate);
  private readonly router = inject(Router);

  private readonly isKarma =
    typeof window !== 'undefined' &&
    !!(window as unknown as { __karma__?: unknown }).__karma__;

  private currentUrl = this.router.url;

  constructor() {
    this.router.events
      .pipe(filter((evt): evt is NavigationEnd => evt instanceof NavigationEnd))
      .subscribe((evt) => {
        this.currentUrl = evt.urlAfterRedirects;
      });

    if (this.swUpdate.isEnabled) {
      let lastCheckAtMs = 0;
      const minCheckIntervalMs = 10_000;

      const checkForUpdate = () => {
        const now = Date.now();
        if (now - lastCheckAtMs < minCheckIntervalMs) {
          return;
        }
        lastCheckAtMs = now;

        this.swUpdate
          .checkForUpdate()
          .catch((err) => console.error('Error checking for update', err));
      };

      // Check immediately on startup.
      checkForUpdate();

      // When the PWA is reopened or the tab becomes active again, check immediately.
      window.addEventListener('focus', checkForUpdate, { passive: true });
      document.addEventListener(
        'visibilitychange',
        () => {
          if (document.visibilityState === 'visible') {
            checkForUpdate();
          }
        },
        { passive: true },
      );

      // Periodic check as a fallback.
      setInterval(checkForUpdate, 60 * 1000);

      this.swUpdate.versionUpdates
        .pipe(
          filter(
            (evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY',
          ),
        )
        .subscribe(() => {
          if (this.isKarma) {
            return;
          }

          this.swUpdate.activateUpdate().then(() => document.location.reload());
        });
    }
  }

  get routeAnimationDuration(): string {
    if (typeof window === 'undefined') {
      return '160ms';
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? '0ms'
      : '160ms';
  }

  get isMobile() {
    return this.MobileService.isMobile;
  }

  showAdminChrome(): boolean {
    return this.authService.isAuthenticated() && this.isAdminRoute();
  }

  private isAdminRoute(): boolean {
    return (
      this.currentUrl === '/admin' || this.currentUrl.startsWith('/admin/')
    );
  }
}
