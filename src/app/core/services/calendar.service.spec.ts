import { TestBed } from '@angular/core/testing';
import { Functions } from '@angular/fire/functions';
import { of } from 'rxjs';
import { CalendarService } from './calendar.service';
import { AuthenticationService } from './authentication.service';
import { MockFunctions } from '../../../test-helpers/firebase-mocks';
import { TestDataFactory } from '../../../test-helpers/test-data-factory';

describe('CalendarService', () => {
  let service: CalendarService;
  let mockFunctions: MockFunctions;
  let mockAuthService: jasmine.SpyObj<AuthenticationService>;

  beforeEach(() => {
    mockFunctions = new MockFunctions();
    mockAuthService = jasmine.createSpyObj('AuthenticationService', ['getCurrentUserId']);
    mockAuthService.getCurrentUserId.and.returnValue('test-user-id');

    TestBed.configureTestingModule({
      providers: [
        CalendarService,
        { provide: Functions, useValue: mockFunctions },
        { provide: AuthenticationService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(CalendarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listCalendars', () => {
    it('should list calendars for current user', (done) => {
      const mockCalendars = {
        items: [
          { id: 'cal-1', summary: 'Calendar 1' },
          { id: 'cal-2', summary: 'Calendar 2' },
        ],
      };

      mockFunctions.httpsCallable.and.returnValue(() => of({ data: mockCalendars }));

      service.listCalendars().subscribe((result) => {
        expect(result).toEqual(mockCalendars);
        done();
      });
    });
  });

  describe('ensureTrimSalonCalendar', () => {
    it('should return existing TrimSalon calendar if it exists', async () => {
      const mockCalendars = {
        items: [
          { id: 'cal-1', summary: 'TrimSalon' },
          { id: 'cal-2', summary: 'Other Calendar' },
        ],
      };

      spyOn(service, 'listCalendars').and.returnValue(of(mockCalendars) as any);

      const calendarId = await service.ensureTrimSalonCalendar();

      expect(calendarId).toBe('cal-1');
    });

    it('should create TrimSalon calendar if it does not exist', async () => {
      const mockCalendars = {
        items: [{ id: 'cal-1', summary: 'Other Calendar' }],
      };

      const newCalendar = { id: 'cal-2', summary: 'TrimSalon' };

      spyOn(service, 'listCalendars').and.returnValue(of(mockCalendars) as any);
      spyOn(service, 'createTrimSalonCalendar').and.returnValue(Promise.resolve(newCalendar));

      const calendarId = await service.ensureTrimSalonCalendar();

      expect(service.createTrimSalonCalendar).toHaveBeenCalled();
      expect(calendarId).toBe('cal-2');
    });
  });

  describe('getAppointments', () => {
    it('should get appointments from calendar', (done) => {
      const mockAppointments = [
        TestDataFactory.createAppointment({ id: 'apt-1' }),
        TestDataFactory.createAppointment({ id: 'apt-2' }),
      ];

      mockFunctions.httpsCallable.and.returnValue(() => of({ data: mockAppointments }));

      service.getAppointments('cal-1').subscribe((result) => {
        expect(result).toEqual(mockAppointments);
        done();
      });
    });
  });

  describe('addAppointment', () => {
    it('should add appointment to calendar', (done) => {
      const appointment = TestDataFactory.createAppointment();
      const mockResponse = { event: appointment };

      mockFunctions.httpsCallable.and.returnValue(() => of({ data: mockResponse }));

      service.addAppointment('cal-1', appointment).subscribe((result) => {
        expect(result).toEqual(appointment);
        done();
      });
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment in calendar', (done) => {
      const appointment = TestDataFactory.createAppointment({ id: 'apt-1' });
      const mockResponse = { event: appointment };

      mockFunctions.httpsCallable.and.returnValue(() => of({ data: mockResponse }));

      service.updateAppointment('cal-1', appointment).subscribe((result) => {
        expect(result).toEqual(appointment);
        done();
      });
    });
  });

  describe('deleteAppointment', () => {
    it('should delete appointment from calendar', (done) => {
      mockFunctions.httpsCallable.and.returnValue(() => of({ data: undefined }));

      service.deleteAppointment('cal-1', 'apt-1').subscribe(() => {
        expect(mockFunctions.httpsCallable).toHaveBeenCalled();
        done();
      });
    });
  });
});
