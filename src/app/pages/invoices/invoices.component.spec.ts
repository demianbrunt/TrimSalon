import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { InvoicesComponent } from './invoices.component';
import { InvoiceService } from '../../core/services/invoice.service';
import { ToastrService } from '../../core/services/toastr.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { MobileService } from '../../core/services/mobile.service';
import { PaymentStatus } from '../../core/models/invoice.model';

describe('InvoicesComponent', () => {
  let component: InvoicesComponent;
  let fixture: ComponentFixture<InvoicesComponent>;
  let mockInvoiceService: jasmine.SpyObj<InvoiceService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockMobileService: jasmine.SpyObj<MobileService>;

  beforeEach(async () => {
    mockInvoiceService = jasmine.createSpyObj('InvoiceService', [
      'getData$',
      'delete',
    ]);
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
    mockMobileService = jasmine.createSpyObj('MobileService', [], {
      isMobile: false,
    });

    mockInvoiceService.getData$.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [InvoicesComponent],
      providers: [
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Router, useValue: mockRouter },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
        { provide: MobileService, useValue: mockMobileService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate print content for invoice', () => {
    // Arrange
    const mockInvoice = {
      id: '1',
      invoiceNumber: 'INV-001',
      client: {
        id: '1',
        name: 'Test Client',
        email: 'test@example.com',
        phone: '0612345678',
        dogs: [],
      },
      subtotal: 100,
      vatRate: 21,
      vatAmount: 21,
      totalAmount: 121,
      paymentStatus: PaymentStatus.PAID,
      issueDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-31'),
      paidDate: new Date('2024-01-15'),
      notes: 'Test notes',
      items: [],
    };

    // Spy on window.open
    spyOn(window, 'open').and.returnValue(null);

    // Act
    component.printInvoice(mockInvoice);

    // Assert - just verify the method was called (window.open will be null in test environment)
    expect(window.open).toHaveBeenCalled();
  });

  it('should format currency correctly', () => {
    const result = component.formatCurrency(123.45);
    expect(result).toContain('123');
    expect(result).toContain('45');
  });

  it('should get correct status severity', () => {
    expect(component.getStatusSeverity(PaymentStatus.PAID)).toBe('success');
    expect(component.getStatusSeverity(PaymentStatus.PENDING)).toBe('warn');
    expect(component.getStatusSeverity(PaymentStatus.OVERDUE)).toBe('danger');
    expect(component.getStatusSeverity(PaymentStatus.CANCELLED)).toBe(
      'secondary',
    );
  });

  it('should get correct status label', () => {
    expect(component.getStatusLabel(PaymentStatus.PAID)).toBe('Betaald');
    expect(component.getStatusLabel(PaymentStatus.PENDING)).toBe('Openstaand');
    expect(component.getStatusLabel(PaymentStatus.OVERDUE)).toBe(
      'Achterstallig',
    );
    expect(component.getStatusLabel(PaymentStatus.CANCELLED)).toBe(
      'Geannuleerd',
    );
  });
});
