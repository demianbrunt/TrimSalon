import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appointment } from '../models/appointment.model';
import { GoogleCalendar, GoogleCalendarList } from '../models/calendar.model';
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

  listCalendars(): Observable<GoogleCalendarList> {
    const userId = this.authService.getCurrentUserId();
    return this.call<GoogleCalendarList>('listCalendars', { userId });
  }

  async ensureTrimSalonCalendar(): Promise<string> {
    const calendars = await this.listCalendars().toPromise();
    let calendar = calendars.items.find((cal) => cal.summary === 'TrimSalon');
    if (!calendar) {
      calendar = await this.createTrimSalonCalendar();
    }
    return calendar.id;
  }

  createTrimSalonCalendar(): Promise<GoogleCalendar> {
    const userId = this.authService.getCurrentUserId();
    return this.call<GoogleCalendar>('createCalendar', {
      userId,
      summary: 'TrimSalon',
    }).toPromise();
  }

  getAppointments(calendarId: string): Observable<Appointment[]> {
    const userId = this.authService.getCurrentUserId();
    return this.call<Appointment[]>('getCalendarEvents', {
      userId,
      calendarId,
    });
  }

  addAppointment(
    calendarId: string,
    appointment: Appointment,
  ): Observable<Appointment> {
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
    const userId = this.authService.getCurrentUserId();
    return this.call<void>('deleteCalendarEvent', {
      userId,
      calendarId,
      eventId: appointmentId,
    });
  }
}
