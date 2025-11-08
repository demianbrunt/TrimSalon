import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { InvoiceFormComponent } from './invoice-form.component';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ClientService } from '../../../core/services/client.service';
import { ToastrService } from '../../../core/services/toastr.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { PaymentStatus } from '../../../core/models/invoice.model';

describe('InvoiceFormComponent', () => {
  let component: InvoiceFormComponent;
  let fixture: ComponentFixture<InvoiceFormComponent>;
  let mockInvoiceService: jasmine.SpyObj<InvoiceService>;
  let mockClientService: jasmine.SpyObj<ClientService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  beforeEach(async () => {
    mockInvoiceService = jasmine.createSpyObj('InvoiceService', [
      'getById',
      'add',
      'update',
    ]);
    mockClientService = jasmine.createSpyObj('ClientService', ['getData$']);
    mockToastrService = jasmine.createSpyObj('ToastrService', [
      'success',
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

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null),
        },
      } as any,
    };

    mockClientService.getData$.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [InvoiceFormComponent, ReactiveFormsModule],
      providers: [
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: ClientService, useValue: mockClientService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should auto-set paid date when payment status changes to PAID', () => {
    // Arrange
    const form = component.form;
    expect(form.get('paidDate')?.value).toBeNull();

    // Act
    form.patchValue({ paymentStatus: PaymentStatus.PAID });

    // Assert
    expect(form.get('paidDate')?.value).toBeInstanceOf(Date);
  });

  it('should not override existing paid date when payment status changes to PAID', () => {
    // Arrange
    const existingDate = new Date('2024-01-15');
    const form = component.form;
    form.patchValue({ paidDate: existingDate });

    // Act
    form.patchValue({ paymentStatus: PaymentStatus.PAID });

    // Assert
    expect(form.get('paidDate')?.value).toEqual(existingDate);
  });

  it('should not set paid date when payment status changes to non-PAID status', () => {
    // Arrange
    const form = component.form;
    form.patchValue({ paidDate: null });

    // Act
    form.patchValue({ paymentStatus: PaymentStatus.PENDING });

    // Assert
    expect(form.get('paidDate')?.value).toBeNull();
  });

  it('should calculate totals correctly', () => {
    // Arrange
    const form = component.form;

    // Act
    form.patchValue({
      subtotal: 100,
      vatRate: 21,
    });

    // Assert
    expect(form.get('vatAmount')?.value).toBe(21);
    expect(form.get('totalAmount')?.value).toBe(121);
  });
});
