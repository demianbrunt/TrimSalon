import { TestBed } from '@angular/core/testing';
import { NEVER, of } from 'rxjs';
import { Appointment } from '../models/appointment.model';
import { AppointmentService } from './appointment.service';
import { AuthenticationService } from './authentication.service';
import { CalendarService } from './calendar.service';
import { GoogleAuthService } from './google-auth.service';
import { GoogleCalendarSync } from './google-calendar-sync';
import { ToastrService } from './toastr.service';

describe('GoogleCalendarSync', () => {
  let service: GoogleCalendarSync;
  let calendarService: jasmine.SpyObj<CalendarService>;
  let appointmentService: jasmine.SpyObj<AppointmentService>;
  let googleAuthService: jasmine.SpyObj<GoogleAuthService>;
  let authService: jasmine.SpyObj<AuthenticationService>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  const mockAppointments: Appointment[] = [
    {
      id: 'apt1',
      startTime: new Date('2025-11-15T10:00:00.000Z'),
      endTime: new Date('2025-11-15T11:00:00.000Z'),
      dog: {
        name: 'Bella',
        breed: { id: 'b1', name: 'Labrador', size: 'large' },
      },
      client: {
        name: 'Jan Jansen',
        email: 'jan@example.com',
        phone: '0612345678',
        dogs: [],
      },
      services: [{ id: 's1', name: 'Wassen', description: 'Hond wassen' }],
      packages: [],
      notes: 'Test appointment',
    },
    {
      id: 'apt2',
      startTime: new Date('2025-11-15T14:00:00.000Z'),
      endTime: new Date('2025-11-15T15:00:00.000Z'),
      dog: {
        name: 'Max',
        breed: { id: 'b2', name: 'Poedel', size: 'medium' },
      },
      client: {
        name: 'Piet Pieters',
        email: 'piet@example.com',
        phone: '0687654321',
        dogs: [],
      },
      services: [{ id: 's2', name: 'Knippen', description: 'Hond knippen' }],
      packages: [],
      notes: '',
    },
  ];

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
    appointmentService = TestBed.inject(
      AppointmentService,
    ) as jasmine.SpyObj<AppointmentService>;
    googleAuthService = TestBed.inject(
      GoogleAuthService,
    ) as jasmine.SpyObj<GoogleAuthService>;
    authService = TestBed.inject(
      AuthenticationService,
    ) as jasmine.SpyObj<AuthenticationService>;
    toastrService = TestBed.inject(
      ToastrService,
    ) as jasmine.SpyObj<ToastrService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
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
});
