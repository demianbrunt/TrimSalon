import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FIRESTORE_COLLECTION } from '../constants/firestore-collections';
import { Appointment } from '../models/appointment.model';
import { BaseService } from './base.service';
import { CalendarService } from './calendar.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService extends BaseService<Appointment> {
  private readonly calendarService = inject(CalendarService);

  constructor() {
    super(FIRESTORE_COLLECTION.appointments);
  }

  override add(item: Appointment): Observable<Appointment> {
    return super.add(item).pipe(tap(() => this.triggerSync()));
  }

  override update(item: Appointment): Observable<Appointment> {
    return super.update(item).pipe(tap(() => this.triggerSync()));
  }

  override delete(id: string): Observable<void> {
    return super.delete(id).pipe(tap(() => this.triggerSync()));
  }

  private triggerSync() {
    // Fire and forget - don't block the UI
    this.calendarService.triggerSync().subscribe({
      error: (err) => console.error('Background sync trigger failed', err),
    });
  }
}
