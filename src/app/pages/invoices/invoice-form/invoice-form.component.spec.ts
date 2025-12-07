import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Invoice, PaymentStatus } from '../../../core/models/invoice.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ClientService } from '../../../core/services/client.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ToastrService } from '../../../core/services/toastr.service';
import { InvoiceFormComponent } from './invoice-form.component';

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

  const mockInvoice: Invoice = {
    id: 'invoice-123',
    invoiceNumber: 'INV-2024-001',
    client: {
      id: 'client-1',
      name: 'John',
      email: 'j@e.com',
      phone: '123',
      dogs: [],
    },
    subtotal: 100,
    vatRate: 21,
    vatAmount: 21,
    totalAmount: 121,
    paymentStatus: PaymentStatus.PENDING,
    issueDate: new Date(),
    dueDate: new Date(),
    items: [],
  };

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
          has: jasmine.createSpy('has').and.returnValue(false),
          keys: [],
          getAll: jasmine.createSpy('getAll').and.returnValue([]),
        },
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue(null),
          has: jasmine.createSpy('has').and.returnValue(false),
          keys: [],
          getAll: jasmine.createSpy('getAll').and.returnValue([]),
        },
        data: {},
      } as any,
      params: of({}),
      queryParams: of({}),
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
    // Wait for async initForm to complete
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should auto-set paid date when payment status changes to PAID', fakeAsync(() => {
    // Arrange
    const form = component.form;
    expect(form.get('paidDate')?.value).toBeNull();

    // Act
    form.patchValue({ paymentStatus: PaymentStatus.PAID });
    tick();

    // Assert
    expect(form.get('paidDate')?.value).toBeInstanceOf(Date);
  }));

  it('should not override existing paid date when payment status changes to PAID', fakeAsync(() => {
    // Arrange
    const existingDate = new Date('2024-01-15');
    const form = component.form;
    form.patchValue({ paidDate: existingDate });

    // Act
    form.patchValue({ paymentStatus: PaymentStatus.PAID });
    tick();

    // Assert
    expect(form.get('paidDate')?.value).toEqual(existingDate);
  }));

  it('should not set paid date when payment status changes to non-PAID status', fakeAsync(() => {
    // Arrange
    const form = component.form;
    form.patchValue({ paidDate: null });

    // Act
    form.patchValue({ paymentStatus: PaymentStatus.PENDING });
    tick();

    // Assert
    expect(form.get('paidDate')?.value).toBeNull();
  }));

  it('should calculate totals correctly', fakeAsync(() => {
    // Arrange
    const form = component.form;

    // Act
    form.patchValue({
      subtotal: 100,
      vatRate: 21,
    });
    tick();

    // Assert
    expect(form.get('vatAmount')?.value).toBe(21);
    expect(form.get('totalAmount')?.value).toBe(121);
  }));

  it('should call add invoice on submit in create mode', fakeAsync(() => {
    mockInvoiceService.add.and.returnValue(of(mockInvoice));

    component.form.patchValue({
      invoiceNumber: 'INV-NEW',
      client: mockInvoice.client,
      subtotal: 100,
      vatRate: 21,
      paymentStatus: PaymentStatus.PENDING,
      issueDate: new Date(),
      dueDate: new Date(),
    });

    component.submit();
    tick(100);

    expect(mockInvoiceService.add).toHaveBeenCalled();
  }));

  describe('Edit mode', () => {
    beforeEach(async () => {
      (
        mockActivatedRoute.snapshot!.paramMap.get as jasmine.Spy
      ).and.returnValue('invoice-123');
      (
        mockActivatedRoute.snapshot!.paramMap.has as jasmine.Spy
      ).and.returnValue(true);
      mockInvoiceService.getById.and.returnValue(of(mockInvoice));

      fixture = TestBed.createComponent(InvoiceFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
    });

    it('should load invoice data', () => {
      expect(mockInvoiceService.getById).toHaveBeenCalledWith('invoice-123');
      expect(component.form.get('invoiceNumber')?.value).toBe('INV-2024-001');
    });

    it('should call update invoice on submit', fakeAsync(() => {
      mockInvoiceService.update.and.returnValue(of(mockInvoice));

      component.submit();
      tick(100);

      expect(mockInvoiceService.update).toHaveBeenCalled();
    }));
  });
});
