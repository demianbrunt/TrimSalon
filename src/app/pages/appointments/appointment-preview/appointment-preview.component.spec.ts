import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Appointment } from '../../../core/models/appointment.model';
import { AppointmentService } from '../../../core/services/appointment.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ToastrService } from '../../../core/services/toastr.service';
import { AppointmentPreviewComponent } from './appointment-preview.component';

describe('AppointmentPreviewComponent', () => {
  let fixture: ComponentFixture<AppointmentPreviewComponent>;
  let component: AppointmentPreviewComponent;

  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockToastr: jasmine.SpyObj<ToastrService>;

  const appointment: Appointment = {
    id: 'apt-1',
    client: {
      id: 'client-1',
      name: 'Test Client',
      email: 'test@example.com',
      phone: '0612345678',
      dogs: [],
    },
    dog: {
      name: 'Fido',
      breed: { id: 'breed-1', name: 'Labrador', size: 'medium' },
      age: 3,
      gender: 'male',
      isNeutered: true,
      isAggressive: false,
    },
    startTime: new Date('2024-02-01T09:00:00.000Z'),
    endTime: new Date('2024-02-01T10:00:00.000Z'),
  };

  beforeEach(async () => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', [
      'getById',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', [
      'setItems',
    ]);
    mockToastr = jasmine.createSpyObj('ToastrService', ['error']);

    await TestBed.configureTestingModule({
      imports: [AppointmentPreviewComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'apt-1' : null),
              },
            },
          },
        },
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: Router, useValue: mockRouter },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        { provide: ToastrService, useValue: mockToastr },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    mockAppointmentService.getById.and.returnValue(of(appointment));

    fixture = TestBed.createComponent(AppointmentPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.isLoading).toBeFalse();
    expect(component.appointment?.id).toBe('apt-1');
  });

  it('should navigate to not-found when loading fails', () => {
    mockAppointmentService.getById.and.returnValue(
      throwError(() => new Error('Nope')),
    );

    fixture = TestBed.createComponent(AppointmentPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(mockToastr.error).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });
});
