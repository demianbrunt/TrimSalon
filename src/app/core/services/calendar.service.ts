import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appointment } from '../models/appointment.model';
import { GoogleCalendar, GoogleCalendarList } from '../models/calendar.model';
import { isMockGoogleEnabled } from '../utils/dev-flags';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private readonly functions: Functions = inject(Functions);
  private readonly authService = inject(AuthenticationService);

  private call<T>(functionName: string, data?: unknown): Observable<T> {
    const callable = httpsCallable(this.functions, functionName);
    return from(callable(data)).pipe(map((result) => result.data as T));
  }

  triggerSync(): Observable<{ success: boolean }> {
    if (isMockGoogleEnabled()) {
      return of({ success: true });
    }
    return this.call<{ success: boolean }>('triggerCalendarSync');
  }

  listCalendars(): Observable<GoogleCalendarList> {
    if (isMockGoogleEnabled()) {
      return of({ items: [] });
    }
    const userId = this.authService.getCurrentUserId();
    return this.call<GoogleCalendarList>('listCalendars', { userId });
  }

  async ensureTrimSalonCalendar(): Promise<string> {
    if (isMockGoogleEnabled()) {
      return 'mock-trimsalon-calendar';
    }
    const calendars = await this.listCalendars().toPromise();
    if (!calendars?.items) {
      throw new Error('Unable to retrieve calendar list');
    }
    let calendar = calendars.items.find((cal) => cal.summary === 'TrimSalon');
    if (!calendar) {
      calendar = await this.createTrimSalonCalendar();
    }
    return calendar.id;
  }

  createTrimSalonCalendar(): Promise<GoogleCalendar> {
    if (isMockGoogleEnabled()) {
      return Promise.resolve({
        id: 'mock-trimsalon-calendar',
        summary: 'TrimSalon',
      });
    }
    const userId = this.authService.getCurrentUserId();
    return this.call<GoogleCalendar>('createCalendar', {
      userId,
      summary: 'TrimSalon',
    }).toPromise();
  }

  getAppointments(calendarId: string): Observable<Appointment[]> {
    if (isMockGoogleEnabled()) {
      return of([]);
    }
    const userId = this.authService.getCurrentUserId();
    return this.call<{ events: Appointment[] }>('getCalendarEvents', {
      userId,
      calendarId,
    }).pipe(map((result) => result.events || []));
  }

  getRawCalendarEvents(calendarId: string): Observable<any[]> {
    if (isMockGoogleEnabled()) {
      return of([]);
    }
    const userId = this.authService.getCurrentUserId();
    return this.call<{ events: any[] }>('getCalendarEvents', {
      userId,
      calendarId,
    }).pipe(map((result) => result.events || []));
  }

  addAppointment(
    calendarId: string,
    appointment: Appointment,
  ): Observable<Appointment> {
    if (isMockGoogleEnabled()) {
      return of(appointment);
    }
    const userId = this.authService.getCurrentUserId();
    return this.call<{ event: Appointment }>('createCalendarEvent', {
      userId,
      calendarId,
      event: appointment,
    }).pipe(map((result) => result.event));
  }

  updateAppointment(
    calendarId: string,
    appointment: Appointment,
  ): Observable<Appointment> {
    if (isMockGoogleEnabled()) {
      return of(appointment);
    }
    const userId = this.authService.getCurrentUserId();
    return this.call<{ event: Appointment }>('updateCalendarEvent', {
      userId,
      calendarId,
      eventId: appointment.id,
      event: appointment,
    }).pipe(map((result) => result.event));
  }

  deleteAppointment(
    calendarId: string,
    appointmentId: string,
  ): Observable<void> {
    if (isMockGoogleEnabled()) {
      return of(void 0);
    }
    const userId = this.authService.getCurrentUserId();
    return this.call<void>('deleteCalendarEvent', {
      userId,
      calendarId,
      eventId: appointmentId,
    });
  }
}
