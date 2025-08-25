import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LongPressDirective } from '../../directives/long-press.directive';

@Component({
  selector: 'app-sub-nav',
  imports: [ButtonModule, RouterLink, RouterLinkActive, LongPressDirective],
  styles: [
    `
      .active-nav-button {
        background: var(--p-button-text-primary-hover-background);
      }
    `,
  ],
  template: `
    <div
      class="flex justify-content-between align-items-center px-3 pt-2 shadow-2"
      style="padding-bottom: calc(env(safe-area-inset-bottom))"
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
      }
    </div>
  `,
})
export class SubNavComponent {
  navItems = [
    {
      icon: 'pi pi-calendar',
      link: '/calendar',
      longPressAction: () => this.openGoogleCalendar(),
    },
    { icon: 'pi pi-address-book', link: '/clients' },
    { icon: 'pi pi-box', link: '/packages' },
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
