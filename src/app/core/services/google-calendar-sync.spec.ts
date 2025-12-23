import { TestBed } from '@angular/core/testing';
import { NEVER, of } from 'rxjs';
import { AppointmentService } from './appointment.service';
import { AuthenticationService } from './authentication.service';
import { CalendarService } from './calendar.service';
import { GoogleAuthService } from './google-auth.service';
import { GoogleCalendarSync, type SyncStatus } from './google-calendar-sync';
import { ToastrService } from './toastr.service';

describe('GoogleCalendarSync', () => {
  let service: GoogleCalendarSync;
  let calendarService: jasmine.SpyObj<CalendarService>;

  const mockCalendarEvents = [
    {
      id: 'gcal1',
      summary: 'Bella (Jan Jansen)',
      start: { dateTime: '2025-11-15T10:00:00.000Z' },
      end: { dateTime: '2025-11-15T11:00:00.000Z' },
    },
    {
      id: 'gcal2',
      summary: 'Max (Piet Pieters)',
      start: { dateTime: '2025-11-15T14:00:00.000Z' },
      end: { dateTime: '2025-11-15T15:00:00.000Z' },
    },
  ];

  beforeEach(() => {
    try {
      localStorage.removeItem('trimSalon_mockGoogle');
      localStorage.removeItem('googleCalendarSyncSettings');
      localStorage.removeItem('googleCalendarSyncSettings:testUser123');
    } catch {
      // ignore
    }

    const calendarSpy = jasmine.createSpyObj('CalendarService', [
      'ensureTrimSalonCalendar',
      'triggerSync',
      'getAppointments',
      'getRawCalendarEvents',
      'addAppointment',
      'updateAppointment',
      'deleteAppointment',
    ]);
    const appointmentSpy = jasmine.createSpyObj('AppointmentService', [], {
      getData$: of([]), // Property spy with default empty array
    });
    const googleAuthSpy = jasmine.createSpyObj('GoogleAuthService', [
      'getAuthCode',
    ]);
    const authSpy = jasmine.createSpyObj('AuthenticationService', [
      'getCurrentUserId',
    ]);
    const toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
    ]);

    // Setup default spy behaviors
    // Prevent the service constructor from auto-starting sync (it schedules a setTimeout)
    // which can keep Karma alive and cause disconnects.
    googleAuthSpy.authorizationComplete$ = NEVER;
    googleAuthSpy.authorizationError$ = NEVER;
    authSpy.getCurrentUserId.and.returnValue('testUser123');

    calendarSpy.triggerSync.and.returnValue(of({ success: true }));

    TestBed.configureTestingModule({
      providers: [
        GoogleCalendarSync,
        { provide: CalendarService, useValue: calendarSpy },
        { provide: AppointmentService, useValue: appointmentSpy },
        { provide: GoogleAuthService, useValue: googleAuthSpy },
        { provide: AuthenticationService, useValue: authSpy },
        { provide: ToastrService, useValue: toastrSpy },
      ],
    });

    service = TestBed.inject(GoogleCalendarSync);
    calendarService = TestBed.inject(
      CalendarService,
    ) as jasmine.SpyObj<CalendarService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should surface authorization errors in sync status', (done) => {
    TestBed.resetTestingModule();

    const calendarSpy = jasmine.createSpyObj('CalendarService', [
      'ensureTrimSalonCalendar',
      'triggerSync',
      'getAppointments',
      'getRawCalendarEvents',
      'addAppointment',
      'updateAppointment',
      'deleteAppointment',
    ]);
    const appointmentSpy = jasmine.createSpyObj('AppointmentService', [], {
      getData$: of([]),
    });
    const googleAuthSpy = jasmine.createSpyObj('GoogleAuthService', [
      'getAuthCode',
    ]);
    const authSpy = jasmine.createSpyObj('AuthenticationService', [
      'getCurrentUserId',
    ]);
    const toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
    ]);

    googleAuthSpy.authorizationComplete$ = NEVER;
    googleAuthSpy.authorizationError$ = of('Backend OAuth misconfigured');
    authSpy.getCurrentUserId.and.returnValue('testUser123');

    TestBed.configureTestingModule({
      providers: [
        GoogleCalendarSync,
        { provide: CalendarService, useValue: calendarSpy },
        { provide: AppointmentService, useValue: appointmentSpy },
        { provide: GoogleAuthService, useValue: googleAuthSpy },
        { provide: AuthenticationService, useValue: authSpy },
        { provide: ToastrService, useValue: toastrSpy },
      ],
    });

    const fresh = TestBed.inject(GoogleCalendarSync);

    fresh.syncStatus$.subscribe((status: SyncStatus) => {
      if (status.error) {
        expect(status.error).toContain('Backend OAuth misconfigured');
        done();
      }
    });
  });

  describe('clearCalendar', () => {
    it('should delete all events from calendar', async () => {
      calendarService.ensureTrimSalonCalendar.and.returnValue(
        Promise.resolve('calendar123'),
      );
      calendarService.getRawCalendarEvents.and.returnValue(
        of(mockCalendarEvents),
      );
      calendarService.deleteAppointment.and.returnValue(of(void 0));

      await service.clearCalendar();

      expect(calendarService.getRawCalendarEvents).toHaveBeenCalledWith(
        'calendar123',
      );
      expect(calendarService.deleteAppointment).toHaveBeenCalledTimes(2);
      expect(calendarService.deleteAppointment).toHaveBeenCalledWith(
        'calendar123',
        'gcal1',
      );
      expect(calendarService.deleteAppointment).toHaveBeenCalledWith(
        'calendar123',
        'gcal2',
      );
    });

    it('should handle empty calendar', async () => {
      calendarService.ensureTrimSalonCalendar.and.returnValue(
        Promise.resolve('calendar123'),
      );
      calendarService.getRawCalendarEvents.and.returnValue(of([]));

      await service.clearCalendar();

      expect(calendarService.deleteAppointment).not.toHaveBeenCalled();
    });

    it('should initialize calendar ID if not set', async () => {
      // Service starts without calendar ID
      calendarService.ensureTrimSalonCalendar.and.returnValue(
        Promise.resolve('new-calendar-id'),
      );
      calendarService.getRawCalendarEvents.and.returnValue(of([]));

      await service.clearCalendar();

      expect(calendarService.ensureTrimSalonCalendar).toHaveBeenCalled();
      expect(calendarService.getRawCalendarEvents).toHaveBeenCalledWith(
        'new-calendar-id',
      );
    });
  });

  describe('sync settings', () => {
    it('should update sync settings', () => {
      const newSettings = {
        autoSync: true,
        syncInterval: 30,
        syncPrivateCalendar: false,
        syncWorkCalendar: true,
      };

      service.updateSyncSettings(newSettings);

      service.syncSettings$.subscribe((settings) => {
        expect(settings).toEqual(newSettings);
      });
    });
  });

  describe('startSync', () => {
    it('should mark auth errors as re-authorization needed (unauthenticated)', async () => {
      let lastStatus: SyncStatus | undefined;
      const sub = service.syncStatus$.subscribe((s) => (lastStatus = s));

      calendarService.ensureTrimSalonCalendar.and.returnValue(
        Promise.reject({
          code: 'unauthenticated',
          message: 'User is not authenticated.',
        }),
      );

      await service.startSync();

      expect(lastStatus?.enabled).toBeFalse();
      expect(lastStatus?.syncing).toBeFalse();
      expect(String(lastStatus?.error)).toContain(
        'Google Agenda autorisatie is verlopen',
      );

      sub.unsubscribe();
    });

    it('should expose non-auth errors directly', async () => {
      let lastStatus: SyncStatus | undefined;
      const sub = service.syncStatus$.subscribe((s) => (lastStatus = s));

      calendarService.ensureTrimSalonCalendar.and.returnValue(
        Promise.reject({
          code: 'internal',
          message: 'Failed to list calendars.',
        }),
      );

      await service.startSync();

      expect(lastStatus?.enabled).toBeFalse();
      expect(lastStatus?.syncing).toBeFalse();
      expect(lastStatus?.error).toBe('Failed to list calendars.');

      sub.unsubscribe();
    });
  });
});
