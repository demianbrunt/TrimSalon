import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Appointment } from '../../../core/models/appointment.model';
import { Client } from '../../../core/models/client.model';
import { Dog } from '../../../core/models/dog.model';
import { AppointmentService } from '../../../core/services/appointment.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ClientService } from '../../../core/services/client.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { PackageService } from '../../../core/services/package.service';
import { PricingService } from '../../../core/services/pricing.service';
import { ServiceService } from '../../../core/services/service.service';
import { ToastrService } from '../../../core/services/toastr.service';
import { AppointmentFormComponent } from './appointment-form.component';

describe('AppointmentFormComponent', () => {
  let component: AppointmentFormComponent;
  let fixture: ComponentFixture<AppointmentFormComponent>;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockClientService: jasmine.SpyObj<ClientService>;
  let mockServiceService: jasmine.SpyObj<ServiceService>;
  let mockPackageService: jasmine.SpyObj<PackageService>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockPricingService: jasmine.SpyObj<PricingService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  const mockDog: Dog = {
    name: 'Fido',
    breed: { id: 'breed-1', name: 'Labrador', size: 'medium' },
    age: 5,
    gender: 'male',
    isNeutered: true,
    isAggressive: false,
  };

  const mockClient: Client = {
    id: 'client-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123',
    dogs: [mockDog],
  };

  const mockAppointment: Appointment = {
    id: 'appointment-123',
    client: mockClient,
    dog: mockDog,
    services: [],
    packages: [],
    startTime: new Date(),
    endTime: new Date(),
    notes: 'Test appointment',
  };

  beforeEach(async () => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', [
      'getById',
      'add',
      'update',
    ]);
    mockClientService = jasmine.createSpyObj('ClientService', ['getData$']);
    mockServiceService = jasmine.createSpyObj('ServiceService', ['getData$']);
    mockPackageService = jasmine.createSpyObj('PackageService', ['getData$']);
    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', [
      'setItems',
    ]);
    mockPricingService = jasmine.createSpyObj('PricingService', [
      'calculatePrice',
      'calculateHourlyRate',
      'calculateTotalPrice',
    ]);
    mockToastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], { events: of() });
    mockConfirmationDialogService = jasmine.createSpyObj(
      'ConfirmationDialogService',
      ['open'],
    );

    mockClientService.getData$.and.returnValue(of([mockClient]));
    mockServiceService.getData$.and.returnValue(of([]));
    mockPackageService.getData$.and.returnValue(of([]));

    mockPricingService.calculateTotalPrice.and.returnValue({
      totalPrice: 100,
      breakdown: [],
    });

    mockPricingService.calculateHourlyRate.and.callFake(
      (totalPrice: number, totalMinutes: number) => ({
        effectiveHourlyRate:
          totalMinutes > 0 ? totalPrice / (totalMinutes / 60) : 0,
        totalPrice,
        totalMinutes,
        targetRate: 60,
        rateComparison: 0,
      }),
    );

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null),
          has: jasmine.createSpy('has').and.returnValue(false),
        },
        data: {},
      } as unknown,
    } as Partial<ActivatedRoute>;

    await TestBed.configureTestingModule({
      imports: [AppointmentFormComponent, ReactiveFormsModule],
      providers: [
        provideNoopAnimations(),
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: ClientService, useValue: mockClientService },
        { provide: ServiceService, useValue: mockServiceService },
        { provide: PackageService, useValue: mockPackageService },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        { provide: PricingService, useValue: mockPricingService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentFormComponent);
    component = fixture.componentInstance;
  });

  describe('Create mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be in create mode', () => {
      expect(component.isCreateMode).toBeTrue();
    });

    it('should call add appointment on submit', fakeAsync(() => {
      mockAppointmentService.add.and.returnValue(of(mockAppointment));

      component.form.patchValue({
        client: mockClient,
        dog: mockDog,
        appointmentDate: new Date(),
        startTime: new Date(),
        endTime: new Date(),
      });

      component.submit();
      tick(100);

      expect(mockAppointmentService.add).toHaveBeenCalled();
    }));
  });

  describe('Edit mode', () => {
    beforeEach(async () => {
      (
        mockActivatedRoute.snapshot!.paramMap.get as jasmine.Spy
      ).and.returnValue('appointment-123');
      (
        mockActivatedRoute.snapshot!.paramMap.has as jasmine.Spy
      ).and.returnValue(true);
      mockAppointmentService.getById.and.returnValue(of(mockAppointment));

      fixture = TestBed.createComponent(AppointmentFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
    });

    it('should load appointment data', () => {
      expect(mockAppointmentService.getById).toHaveBeenCalledWith(
        'appointment-123',
      );
      expect(component.form.get('client')?.value).toEqual(mockClient);
    });

    it('should call update appointment on submit', fakeAsync(() => {
      mockAppointmentService.update.and.returnValue(of(mockAppointment));

      component.submit();
      tick(100);

      expect(mockAppointmentService.update).toHaveBeenCalled();
    }));

    it('should persist actualPrice when provided', fakeAsync(() => {
      mockAppointmentService.update.and.returnValue(of(mockAppointment));

      component.form.patchValue({
        actualPrice: 50,
      });

      component.submit();
      tick(100);

      const updated = mockAppointmentService.update.calls.mostRecent()
        .args[0] as Appointment;
      expect(updated.actualPrice).toBe(50);
    }));
  });
});
