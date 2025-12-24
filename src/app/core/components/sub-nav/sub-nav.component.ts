import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LongPressDirective } from '../../directives/long-press.directive';
import { SwipeDirective } from '../../directives/swipe.directive';

@Component({
  selector: 'app-sub-nav',
  standalone: true,
  imports: [
    ButtonModule,
    RouterLink,
    RouterLinkActive,
    LongPressDirective,
    SwipeDirective,
  ],
  templateUrl: './sub-nav.component.html',
  styleUrls: ['./sub-nav.component.css'],
})
export class SubNavComponent {
  private readonly location = inject(Location);

  navItems = [
    {
      icon: 'pi pi-calendar',
      link: '/admin/appointments',
      longPressAction: () => this.openGoogleCalendar(),
    },
    { icon: 'pi pi-address-book', link: '/admin/clients' },
    { icon: 'pi pi-box', link: '/admin/packages' },
    { icon: 'pi pi-wrench', link: '/admin/services' },
    { icon: 'pi pi-wallet', link: '/admin/expenses' },
    { icon: 'pi pi-file-edit', link: '/admin/invoices' },
    { icon: 'pi pi-chart-bar', link: '/admin/reports' },
    { icon: 'pi pi-cog', link: '/admin/settings' },
  ];

  openGoogleCalendar(): void {
    // This URL will open the Google Calendar app if installed on mobile,
    // or the web version otherwise.
    window.open('https://calendar.google.com/', '_blank');
  }

  goBack(): void {
    this.location.back();
  }

  goForward(): void {
    this.location.forward();
  }
}
