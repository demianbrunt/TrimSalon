import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subject, of } from 'rxjs';
import { MockActivatedRoute } from '../../../test-helpers/angular-mocks';
import { TOAST_TITLE } from '../../core/constants/toast-titles';
import { DEFAULT_APP_SETTINGS } from '../../core/models/app-settings.model';
import { APPOINTMENT_STATUS } from '../../core/models/appointment-status';
import { Appointment } from '../../core/models/appointment.model';
import { Invoice, PaymentStatus } from '../../core/models/invoice.model';
import { AppDialogService } from '../../core/services/app-dialog.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { MobileService } from '../../core/services/mobile.service';
import { ToastrService } from '../../core/services/toastr.service';
import { AppointmentsComponent } from './appointments.component';

describe('AppointmentsComponent', () => {
  let component: AppointmentsComponent;
  let fixture: ComponentFixture<AppointmentsComponent>;

  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockInvoiceService: jasmine.SpyObj<InvoiceService>;
  let mockAppSettingsService: Pick<AppSettingsService, 'settings$'>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockMobileService: jasmine.SpyObj<MobileService>;
  let mockDialogService: jasmine.SpyObj<AppDialogService>;

  const appointment: Appointment = {
    id: 'appointment-1',
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
    estimatedPrice: 75,
  };

  beforeEach(async () => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', [
      'getData$',
      'update',
      'delete',
    ]);
    mockInvoiceService = jasmine.createSpyObj('InvoiceService', [
      'getInvoicesForAppointment$',
      'add',
    ]);
    mockAppSettingsService = {
      settings$: of(DEFAULT_APP_SETTINGS),
    };
    mockToastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'info',
      'error',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', [
      'setItems',
    ]);
    mockConfirmationDialogService = jasmine.createSpyObj(
      'ConfirmationDialogService',
      ['open'],
    );
    mockMobileService = jasmine.createSpyObj('MobileService', [], {
      isMobile: false,
    });
    mockDialogService = jasmine.createSpyObj('AppDialogService', ['open']);

    mockAppointmentService.getData$.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AppointmentsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: new MockActivatedRoute() },
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: AppSettingsService, useValue: mockAppSettingsService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Router, useValue: mockRouter },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
        { provide: MobileService, useValue: mockMobileService },
        { provide: AppDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show a completed indicator in the desktop table', () => {
    const testAppointment = { ...appointment, completed: true };
    component.appointments = [testAppointment];
    component.visibleAppointments = [testAppointment];
    component.statusFilter = APPOINTMENT_STATUS.all;
    fixture.detectChanges();

    const dogCell = fixture.nativeElement.querySelector(
      'p-table tbody tr td:nth-child(2)',
    ) as HTMLElement | null;

    expect(dogCell?.textContent).toContain('Afgerond');
  });

  it('should create invoice as PAID when completing appointment as paid', fakeAsync(() => {
    const onClose$ = new Subject<unknown>();
    const dialogRef = {
      onClose: onClose$.asObservable(),
    } as unknown as DynamicDialogRef;
    mockDialogService.open.and.returnValue(dialogRef);

    mockAppointmentService.update.and.returnValue(of(appointment));
    mockInvoiceService.getInvoicesForAppointment$.and.returnValue(of([]));
    mockInvoiceService.add.and.callFake((inv: Invoice) =>
      of({ ...inv, id: 'inv-1' }),
    );

    component.completeAppointment(appointment);

    const paidDate = new Date('2024-02-02T00:00:00.000Z');
    onClose$.next({
      completed: true,
      actualEndTime: new Date('2024-02-01T10:15:00.000Z'),
      actualPrice: 80,
      notes: 'Done',
      isPaid: true,
      paidDate,
    });
    tick();

    expect(mockInvoiceService.add).toHaveBeenCalled();
    const createdInvoice = mockInvoiceService.add.calls.mostRecent()
      .args[0] as Invoice;
    expect(createdInvoice.paymentStatus).toBe(PaymentStatus.PAID);
    expect(createdInvoice.paidDate).toEqual(paidDate);

    expect(mockToastrService.info).toHaveBeenCalledWith(
      TOAST_TITLE.success,
      'Factuur als betaald aangemaakt',
    );
  }));

  it('should create invoice as PENDING when completing appointment not paid', fakeAsync(() => {
    const onClose$ = new Subject<unknown>();
    const dialogRef = {
      onClose: onClose$.asObservable(),
    } as unknown as DynamicDialogRef;
    mockDialogService.open.and.returnValue(dialogRef);

    mockAppointmentService.update.and.returnValue(of(appointment));
    mockInvoiceService.getInvoicesForAppointment$.and.returnValue(of([]));
    mockInvoiceService.add.and.callFake((inv: Invoice) =>
      of({ ...inv, id: 'inv-1' }),
    );

    component.completeAppointment(appointment);

    onClose$.next({
      completed: true,
      actualEndTime: new Date('2024-02-01T10:15:00.000Z'),
      actualPrice: 80,
      notes: 'Done',
      isPaid: false,
    });
    tick();

    const createdInvoice = mockInvoiceService.add.calls.mostRecent()
      .args[0] as Invoice;
    expect(createdInvoice.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(createdInvoice.paidDate).toBeUndefined();

    expect(mockToastrService.info).toHaveBeenCalledWith(
      TOAST_TITLE.success,
      'Conceptfactuur aangemaakt',
    );
  }));
});
