import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from '../../app.config.model';

// This is needed to access the google object from the GSI script
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let google: any;

interface GoogleAuthResponse {
  code: string;
}

export interface CalendarEvent {
  summary: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
}

interface CalendarEventsResponse {
  events: CalendarEvent[];
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private functions = inject(Functions);
  private config: AppConfig = inject(APP_CONFIG);
  private clientId = this.config.googleAuth.clientId;

  initiateCalendarAccessFlow(userId: string): Observable<void> {
    return new Observable<string>((observer) => {
      try {
        const client = google.accounts.oauth2.initCodeClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          ux_mode: 'popup',
          callback: (response: GoogleAuthResponse) => {
            if (response.code) {
              observer.next(response.code);
              observer.complete();
            } else {
              observer.error('No authorization code received from Google.');
            }
          },
        });
        client.requestCode();
      } catch (error) {
        observer.error(error);
      }
    }).pipe(
      switchMap((code) => {
        const exchangeAuthCode = httpsCallable(
          this.functions,
          'exchangeAuthCode',
        );
        return from(exchangeAuthCode({ code, userId })).pipe(
          map(() => undefined),
        );
      }),
    );
  }

  getCalendarEvents(userId: string): Observable<CalendarEvent[]> {
    const getCalendarEventsFn = httpsCallable<
      { userId: string },
      CalendarEventsResponse
    >(this.functions, 'getCalendarEvents');
    return from(getCalendarEventsFn({ userId })).pipe(
      map((result) => result.data.events),
    );
  }
}
