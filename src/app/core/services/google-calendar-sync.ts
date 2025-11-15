import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  interval,
  Observable,
  of,
  Subscription,
} from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { Appointment } from '../models/appointment.model';
import { AppointmentService } from './appointment.service';
import { AuthenticationService } from './authentication.service';
import { CalendarService } from './calendar.service';
import { GoogleAuthService } from './google-auth.service';

export interface SyncStatus {
  enabled: boolean;
  syncing: boolean;
  lastSync?: Date;
  error?: string;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  syncPrivateCalendar: boolean;
  syncWorkCalendar: boolean;
  privateCalendarId?: string;
  workCalendarId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleCalendarSync {
  private readonly calendarService = inject(CalendarService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthenticationService);
  private readonly googleAuthService = inject(GoogleAuthService);

  private readonly _syncStatus = new BehaviorSubject<SyncStatus>({
    enabled: false,
    syncing: false,
  });

  private readonly _syncSettings = new BehaviorSubject<SyncSettings>({
    autoSync: false,
    syncInterval: 15, // 15 minutes default
    syncPrivateCalendar: false,
    syncWorkCalendar: true,
  });

  syncStatus$ = this._syncStatus.asObservable();
  syncSettings$ = this._syncSettings.asObservable();

  private syncSubscription?: Subscription;
  private trimSalonCalendarId?: string;

  constructor() {
    this.loadSyncSettings();
  }

  private loadSyncSettings(): void {
    const settingsStr = localStorage.getItem('googleCalendarSyncSettings');
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        this._syncSettings.next(settings);
        if (settings.autoSync) {
          this.startAutoSync();
        }
      } catch (error) {
        console.error('Error loading sync settings:', error);
      }
    }
  }

  private saveSyncSettings(settings: SyncSettings): void {
    localStorage.setItem(
      'googleCalendarSyncSettings',
      JSON.stringify(settings),
    );
    this._syncSettings.next(settings);
  }

  updateSyncSettings(settings: Partial<SyncSettings>): void {
    const currentSettings = this._syncSettings.value;
    const newSettings = { ...currentSettings, ...settings };
    this.saveSyncSettings(newSettings);

    // Restart auto-sync if settings changed
    if (
      newSettings.autoSync &&
      newSettings.autoSync !== currentSettings.autoSync
    ) {
      this.startAutoSync();
    } else if (!newSettings.autoSync) {
      this.stopAutoSync();
    }
  }

  async startSync(): Promise<void> {
    const status = this._syncStatus.value;
    if (status.syncing) {
      return; // Already syncing
    }

    this._syncStatus.next({ ...status, syncing: true, error: undefined });

    try {
      // Ensure TrimSalon calendar exists
      this.trimSalonCalendarId =
        await this.calendarService.ensureTrimSalonCalendar();

      // Perform sync
      await this.performSync();

      this._syncStatus.next({
        enabled: true,
        syncing: false,
        lastSync: new Date(),
      });
    } catch (error) {
      console.error('Sync error:', error);
      this._syncStatus.next({
        enabled: false,
        syncing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async performSync(): Promise<void> {
    if (!this.trimSalonCalendarId) {
      throw new Error('TrimSalon calendar not initialized');
    }

    // Get local appointments
    const localAppointments = await this.appointmentService
      .getData$()
      .pipe(take(1))
      .toPromise();

    // Get calendar events
    const calendarAppointments = await this.calendarService
      .getAppointments(this.trimSalonCalendarId)
      .pipe(take(1))
      .toPromise();

    // Sync logic:
    // 1. Create calendar events for new appointments
    // 2. Update existing events
    // 3. Delete events for deleted appointments

    const localAppointmentIds = new Set(
      localAppointments?.map((a) => a.id) || [],
    );
    const calendarAppointmentIds = new Set(
      calendarAppointments?.map((a) => a.id) || [],
    );

    // Find new appointments to add to calendar
    const newAppointments =
      localAppointments?.filter((a) => !calendarAppointmentIds.has(a.id)) || [];

    // Find appointments to update
    const updatedAppointments =
      localAppointments?.filter((a) => calendarAppointmentIds.has(a.id)) || [];

    // Find appointments to delete from calendar
    const deletedAppointmentIds = Array.from(calendarAppointmentIds).filter(
      (id) => !localAppointmentIds.has(id),
    );

    // Perform sync operations
    for (const appointment of newAppointments) {
      await this.calendarService
        .addAppointment(this.trimSalonCalendarId, appointment)
        .pipe(take(1))
        .toPromise();
    }

    for (const appointment of updatedAppointments) {
      await this.calendarService
        .updateAppointment(this.trimSalonCalendarId, appointment)
        .pipe(take(1))
        .toPromise();
    }

    for (const appointmentId of deletedAppointmentIds) {
      if (appointmentId) {
        await this.calendarService
          .deleteAppointment(this.trimSalonCalendarId, appointmentId)
          .pipe(take(1))
          .toPromise();
      }
    }
  }

  startAutoSync(): void {
    this.stopAutoSync(); // Stop any existing auto-sync

    const settings = this._syncSettings.value;
    if (!settings.autoSync) {
      return;
    }

    const intervalMs = settings.syncInterval * 60 * 1000;

    // Sync immediately
    this.startSync();

    // Then sync at intervals
    this.syncSubscription = interval(intervalMs).subscribe(() => {
      this.startSync();
    });

    this._syncStatus.next({
      ...this._syncStatus.value,
      enabled: true,
    });
  }

  stopAutoSync(): void {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
      this.syncSubscription = undefined;
    }

    this._syncStatus.next({
      ...this._syncStatus.value,
      enabled: false,
    });
  }

  async clearCalendar(): Promise<void> {
    if (!this.trimSalonCalendarId) {
      this.trimSalonCalendarId =
        await this.calendarService.ensureTrimSalonCalendar();
    }

    const calendarAppointments = await this.calendarService
      .getAppointments(this.trimSalonCalendarId)
      .pipe(take(1))
      .toPromise();

    if (!calendarAppointments) {
      return;
    }

    for (const appointment of calendarAppointments) {
      if (appointment.id) {
        await this.calendarService
          .deleteAppointment(this.trimSalonCalendarId, appointment.id)
          .pipe(take(1))
          .toPromise();
      }
    }
  }

  requestGoogleAuth(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.googleAuthService.getAuthCode(userId);
    }
  }
}
