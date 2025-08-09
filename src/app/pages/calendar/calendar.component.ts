import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  standalone: true,
  host: {
    class: 'block h-full',
  },
  template: `
    <div class="flex flex-column h-full">
      <div class="flex-grow-1">
        <iframe
          [src]="safeCalendarUrl"
          class="w-full h-full"
          style="border: 0"
          frameborder="0"
          scrolling="no"
        ></iframe>
      </div>
    </div>
  `,
})
export class CalendarComponent {
  safeCalendarUrl: SafeResourceUrl;
  private readonly sanitizer = inject(DomSanitizer);

  constructor() {
    // This is an example public calendar.
    // For this to work, the calendar for "demian.brunt@gmail.com" must be made public.
    const userEmail = 'demian.brunt@gmail.com';
    const encodedEmail = encodeURIComponent(userEmail);
    const calendarUrl = `https://calendar.google.com/calendar/embed?src=${encodedEmail}&mode=WEEK&ctz=America/New_York`;

    this.safeCalendarUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(calendarUrl);
  }
}
