import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LongPressDirective } from '../../directives/long-press.directive';

@Component({
  selector: 'app-sub-nav',
  imports: [ButtonModule, RouterLink, RouterLinkActive, LongPressDirective],
  templateUrl: './sub-nav.component.html',
  styleUrls: ['./sub-nav.component.css'],
})
export class SubNavComponent {
  navItems = [
    {
      icon: 'pi pi-calendar',
      link: '/appointments',
      longPressAction: () => this.openGoogleCalendar(),
    },
    { icon: 'pi pi-address-book', link: '/clients' },
    { icon: 'pi pi-box', link: '/packages' },
    { icon: 'pi pi-wrench', link: '/services' },
    { icon: 'pi pi-wallet', link: '/expenses' },
    { icon: 'pi pi-file-edit', link: '/invoices' },
    { icon: 'pi pi-chart-bar', link: '/reports' },
  ];

  openGoogleCalendar(): void {
    // This URL will open the Google Calendar app if installed on mobile,
    // or the web version otherwise.
    console.log('Opening Google Calendar...');
    window.open('https://calendar.google.com/', '_blank');
  }
}
