import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LongPressDirective } from './core/directives/long-press.directive';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ButtonModule,
    RouterLink,
    RouterLinkActive,
    LongPressDirective,
  ],
  styles: [
    `
      .active-nav-button {
        background: var(--p-button-text-primary-hover-background);
      }
    `,
  ],
  template: `
    <div class="flex flex-column" style="height: 100dvh">
      <div
        class="flex justify-content-between align-items-center px-3 py-3 shadow-2"
      >
        <div class="font-bold text-xl text-primary">TrimSalon</div>
        <p-button icon="pi pi-ellipsis-v" [rounded]="true" [text]="true" />
      </div>

      <div class="flex-grow-1" style="overflow: auto">
        <router-outlet></router-outlet>
      </div>

      <div
        class="flex justify-content-between align-items-center px-3 pt-2 shadow-2"
        style="padding-bottom: calc(1rem + env(safe-area-inset-bottom))"
      >
        @for (item of navItems; track item.link) {
          <p-button
            [routerLink]="item.link"
            pButton
            [rounded]="true"
            size="large"
            routerLinkActive="active-nav-button"
            [text]="true"
            [icon]="item.icon"
            link
            appLongPress
            (longPress)="item.longPressAction?.()"
          ></p-button>
          <!-- <p-button
            [routerLink]="item.link"
            pButton
            [rounded]="true"
            size="large"
            routerLinkActive="active-nav-button"
            [text]="true"
            [icon]="item.icon"
            link
            appLongPress
            (longPress)="openGoogleCalendar()"
          ></p-button> -->
        }
      </div>
    </div>
  `,
})
export class App {
  navItems = [
    {
      icon: 'pi pi-calendar',
      link: '/calendar',
      longPressAction: () => this.openGoogleCalendar(),
    },
    { icon: 'pi pi-address-book', link: '/clients' },
    { icon: 'pi pi-wrench', link: '/services' },
    { icon: 'pi pi-chart-bar', link: '/reports' },
  ];

  openGoogleCalendar(): void {
    // This URL will open the Google Calendar app if installed on mobile,
    // or the web version otherwise.
    console.log('Opening Google Calendar...');
    window.open('https://calendar.google.com/', '_blank');
  }
}
