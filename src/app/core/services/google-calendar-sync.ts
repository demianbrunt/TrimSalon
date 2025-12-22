import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Appointment } from '../models/appointment.model';
import { isMockGoogleEnabled } from '../utils/dev-flags';
import { AppointmentService } from './appointment.service';
import { AuthenticationService } from './authentication.service';
import { CalendarService } from './calendar.service';
import { GoogleAuthService } from './google-auth.service';

interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

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
export class GoogleCalendarSync implements OnDestroy {
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
  private authorizationSubscription?: Subscription;

  constructor() {
    this.loadSyncSettings();

    // Listen for calendar authorization completion
    this.authorizationSubscription =
      this.googleAuthService.authorizationComplete$.subscribe(() => {
        // Wait a bit for backend to save tokens, then start sync
        setTimeout(() => {
          this.startSync();
        }, 2000);
      });
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
    if (isMockGoogleEnabled()) {
      this._syncStatus.next({
        enabled: true,
        syncing: false,
        lastSync: new Date(),
      });
      return;
    }

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

      // Check if this is an authentication error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isAuthError =
        errorMessage.includes('unauthenticated') ||
        errorMessage.includes('authorization has expired') ||
        errorMessage.includes('re-authorize');

      this._syncStatus.next({
        enabled: false,
        syncing: false,
        error: isAuthError
          ? 'Google Agenda autorisatie is verlopen. Klik op "Sync instellingen" om opnieuw te autoriseren.'
          : error instanceof Error
            ? error.message
            : 'Unknown error',
      });
    }
  }

  private async performSync(): Promise<void> {
    // Use the backend function for consistent sync logic
    await this.calendarService.triggerSync().toPromise();
  }

  /*
  // Legacy client-side sync logic - removed in favor of backend sync
  private async performSyncLegacy(): Promise<void> {
    if (!this.trimSalonCalendarId) {
      throw new Error('TrimSalon calendar not initialized');
    }
    // ... (rest of the old logic)
  }
  */

  private async syncBothWays(
    localAppointments: Appointment[],
    calendarEvents: GoogleCalendarEvent[],
  ): Promise<void> {
    if (!this.trimSalonCalendarId) {
      throw new Error('TrimSalon calendar not initialized');
    }

    // Create maps for quick lookup
    const localByGoogleId = new Map(
      localAppointments
        .filter((a) => a.googleCalendarEventId)
        .map((a) => [a.googleCalendarEventId!, a]),
    );

    const calendarEventsById = new Map(calendarEvents.map((e) => [e.id!, e]));

    // SYNC FROM GOOGLE CALENDAR → APP (only updates & deletes)
    for (const [googleEventId, localAppointment] of localByGoogleId) {
      const googleEvent = calendarEventsById.get(googleEventId);

      if (!googleEvent) {
        // Event deleted in Google Calendar → delete locally
        if (localAppointment.id) {
          await this.appointmentService
            .delete(localAppointment.id)
            .pipe(take(1))
            .toPromise();
        }
      } else {
        // Event exists in both → check if dates changed in Google
        const googleStart = new Date(
          googleEvent.start.dateTime || googleEvent.start.date,
        );
        const googleEnd = new Date(
          googleEvent.end.dateTime || googleEvent.end.date,
        );
        const localStart = localAppointment.startTime
          ? new Date(localAppointment.startTime)
          : null;
        const localEnd = localAppointment.endTime
          ? new Date(localAppointment.endTime)
          : null;

        const startChanged =
          localStart && googleStart.getTime() !== localStart.getTime();
        const endChanged =
          localEnd && googleEnd.getTime() !== localEnd.getTime();

        if (startChanged || endChanged) {
          const updatedAppointment = {
            ...localAppointment,
            startTime: googleStart,
            endTime: googleEnd,
            lastModified: new Date(),
          };

          await this.appointmentService
            .update(updatedAppointment)
            .pipe(take(1))
            .toPromise();
        }

        // Mark this event as processed
        calendarEventsById.delete(googleEventId);
      }
    }

    // SYNC FROM APP → GOOGLE CALENDAR
    for (const localAppointment of localAppointments) {
      if (localAppointment.googleCalendarEventId) {
        // Already synced, check if needs update
        const googleEvent = calendarEventsById.get(
          localAppointment.googleCalendarEventId,
        );

        if (googleEvent) {
          // Event exists - check if local changes need to be pushed
          const googleStart = new Date(
            googleEvent.start.dateTime || googleEvent.start.date,
          );
          const googleEnd = new Date(
            googleEvent.end.dateTime || googleEvent.end.date,
          );
          const localStart = localAppointment.startTime
            ? new Date(localAppointment.startTime)
            : null;
          const localEnd = localAppointment.endTime
            ? new Date(localAppointment.endTime)
            : null;

          const startChanged =
            localStart && googleStart.getTime() !== localStart.getTime();
          const endChanged =
            localEnd && googleEnd.getTime() !== localEnd.getTime();

          if (startChanged || endChanged) {
            // Update the appointment with the eventId set
            const appointmentToUpdate = {
              ...localAppointment,
              id: localAppointment.googleCalendarEventId,
            };
            await this.calendarService
              .updateAppointment(this.trimSalonCalendarId, appointmentToUpdate)
              .pipe(take(1))
              .toPromise();
          }
        }
      } else {
        // Not synced yet - create in Google Calendar
        const createdEvent = await this.calendarService
          .addAppointment(this.trimSalonCalendarId, localAppointment)
          .pipe(take(1))
          .toPromise();

        // Save the Google Calendar event ID back to the appointment
        if (createdEvent?.id && localAppointment.id) {
          const updatedAppointment = {
            ...localAppointment,
            googleCalendarEventId: createdEvent.id,
            lastModified: new Date(),
          };
          await this.appointmentService
            .update(updatedAppointment)
            .pipe(take(1))
            .toPromise();
        }
      }
    }

    // Delete events from Google Calendar that don't exist locally anymore
    // (but only if they were created by this app, i.e., we have them in localByGoogleId)
    for (const [googleEventId] of calendarEventsById) {
      // Only delete if this was originally a synced event from our app
      // We can tell because the event ID would have been in localByGoogleId
      const wasOurEvent = localAppointments.some(
        (a) => a.googleCalendarEventId === googleEventId,
      );

      if (wasOurEvent) {
        await this.calendarService
          .deleteAppointment(this.trimSalonCalendarId, googleEventId)
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

    const calendarEvents = await this.calendarService
      .getRawCalendarEvents(this.trimSalonCalendarId)
      .pipe(take(1))
      .toPromise();

    if (!calendarEvents || calendarEvents.length === 0) {
      return;
    }

    for (const event of calendarEvents) {
      if (event.id) {
        await this.calendarService
          .deleteAppointment(this.trimSalonCalendarId, event.id)
          .pipe(take(1))
          .toPromise();
      }
    }
  }

  requestGoogleAuth(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId || isMockGoogleEnabled()) {
      this.googleAuthService.getAuthCode(userId ?? 'dev-user');
    }
  }

  ngOnDestroy(): void {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
    if (this.authorizationSubscription) {
      this.authorizationSubscription.unsubscribe();
    }
  }
}
