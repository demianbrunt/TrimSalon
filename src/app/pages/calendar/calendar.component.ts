import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthenticationService } from '../../core/services/authentication.service';
import {
  CalendarEvent,
  CalendarService,
} from '../../core/services/calendar.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  template: `
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Google Calendar Integration</h1>

      <div *ngIf="authService.isAuthenticated(); else notAuthenticated">
        <p class="mb-2">Press the button to connect your Google Calendar.</p>
        <button (click)="connectCalendar()" class="p-button p-component">
          Connect to Calendar
        </button>

        <button (click)="getEvents()" class="p-button p-component mt-4">
          Get Today's Events
        </button>

        <div *ngIf="events" class="mt-4">
          <h2 class="text-xl font-bold mb-2">Today's Events</h2>
          <ul>
            <li *ngFor="let event of events">
              {{ event.summary }} ({{
                event.start.dateTime | date: 'shortTime'
              }}
              - {{ event.end.dateTime | date: 'shortTime' }})
            </li>
          </ul>
        </div>
      </div>

      <ng-template #notAuthenticated>
        <p class="mb-2">Please sign in to use the calendar integration.</p>
      </ng-template>
    </div>
  `,
})
export class CalendarComponent {
  authService = inject(AuthenticationService);
  private calendarService = inject(CalendarService);
  events: CalendarEvent[] = [];

  connectCalendar(): void {
    if (!this.authService.isAuthenticated) {
      console.error('User is not authenticated.');
      return;
    }

    this.calendarService
      .initiateCalendarAccessFlow(this.authService.user().uid)
      .subscribe();
  }

  getEvents(): void {
    if (!this.authService.isAuthenticated) {
      console.error('User is not authenticated.');
      return;
    }

    this.calendarService
      .getCalendarEvents(this.authService.user().uid)
      .subscribe((events) => {
        this.events = events;
      });
  }
}
