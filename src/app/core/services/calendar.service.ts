import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appointment } from '../models/appointment.model';
import { GoogleCalendar, GoogleCalendarList } from '../models/calendar.model';
import { isMockGoogleEnabled } from '../utils/dev-flags';

interface RawCalendarEvent {
  id?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private readonly functions: Functions = inject(Functions);

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
    return this.call<GoogleCalendarList>('listCalendars');
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
    return this.call<GoogleCalendar>('createCalendar', {
      summary: 'TrimSalon',
    }).toPromise();
  }

  getAppointments(calendarId: string): Observable<Appointment[]> {
    if (isMockGoogleEnabled()) {
      return of([]);
    }
    return this.call<{ events: Appointment[] }>('getCalendarEvents', {
      calendarId,
    }).pipe(map((result) => result.events || []));
  }

  getRawCalendarEvents(calendarId: string): Observable<RawCalendarEvent[]> {
    if (isMockGoogleEnabled()) {
      return of([]);
    }
    return this.call<{ events: RawCalendarEvent[] }>('getCalendarEvents', {
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
    return this.call<{ event: Appointment }>('createCalendarEvent', {
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
    return this.call<{ event: Appointment }>('updateCalendarEvent', {
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
    return this.call<void>('deleteCalendarEvent', {
      calendarId,
      eventId: appointmentId,
    });
  }
}
