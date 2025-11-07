import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReportService } from './report.service';
import { AppointmentService } from './appointment.service';
import { ExpenseService } from './expense.service';
import { InvoiceService } from './invoice.service';
import { PaymentStatus } from '../models/invoice.model';
import { TestDataFactory } from '../../../test-helpers/test-data-factory';

describe('ReportService', () => {
  let service: ReportService;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;
  let mockInvoiceService: jasmine.SpyObj<InvoiceService>;
  let mockExpenseService: jasmine.SpyObj<ExpenseService>;

  beforeEach(() => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', [
      'getData$',
    ]);
    mockInvoiceService = jasmine.createSpyObj('InvoiceService', ['getData$']);
    mockExpenseService = jasmine.createSpyObj('ExpenseService', ['getData$']);

    TestBed.configureTestingModule({
      providers: [
        ReportService,
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: ExpenseService, useValue: mockExpenseService },
      ],
    });

    service = TestBed.inject(ReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRevenueReport', () => {
    it('should calculate revenue for a period', (done) => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const invoices = [
        {
          ...TestDataFactory.createInvoice(),
          issueDate: new Date('2024-01-15'),
          totalAmount: 100,
          paymentStatus: PaymentStatus.PAID,
        },
        {
          ...TestDataFactory.createInvoice(),
          issueDate: new Date('2024-01-20'),
          totalAmount: 150,
          paymentStatus: PaymentStatus.PAID,
        },
        {
          ...TestDataFactory.createInvoice(),
          issueDate: new Date('2024-02-01'),
          totalAmount: 200,
          paymentStatus: PaymentStatus.PAID,
        },
      ];

      mockInvoiceService.getData$.and.returnValue(of(invoices as any));

      service.getRevenueReport(period).subscribe((report) => {
        expect(report.totalRevenue).toBe(250); // 100 + 150
        expect(report.appointmentCount).toBe(2);
        expect(report.averageRevenuePerAppointment).toBe(125);
        done();
      });
    });

    it('should exclude unpaid invoices', (done) => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const invoices = [
        {
          ...TestDataFactory.createInvoice(),
          issueDate: new Date('2024-01-15'),
          totalAmount: 100,
          paymentStatus: PaymentStatus.PAID,
        },
        {
          ...TestDataFactory.createInvoice(),
          issueDate: new Date('2024-01-20'),
          totalAmount: 150,
          paymentStatus: PaymentStatus.PENDING,
        },
      ];

      mockInvoiceService.getData$.and.returnValue(of(invoices as any));

      service.getRevenueReport(period).subscribe((report) => {
        expect(report.totalRevenue).toBe(100);
        expect(report.appointmentCount).toBe(1);
        done();
      });
    });

    it('should handle empty invoices', (done) => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      mockInvoiceService.getData$.and.returnValue(of([]));

      service.getRevenueReport(period).subscribe((report) => {
        expect(report.totalRevenue).toBe(0);
        expect(report.appointmentCount).toBe(0);
        expect(report.averageRevenuePerAppointment).toBe(0);
        done();
      });
    });
  });

  describe('getExpenseReport', () => {
    it('should calculate expenses for a period', (done) => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const expenses = [
        {
          ...TestDataFactory.createExpense(),
          date: new Date('2024-01-10'),
          amount: 50,
        },
        {
          ...TestDataFactory.createExpense(),
          date: new Date('2024-01-15'),
          amount: 75,
        },
        {
          ...TestDataFactory.createExpense(),
          date: new Date('2024-02-01'),
          amount: 100,
        },
      ];

      mockExpenseService.getData$.and.returnValue(of(expenses as any));

      service.getExpenseReport(period).subscribe((report) => {
        expect(report.totalExpenses).toBe(125); // 50 + 75
        expect(report.expenseCount).toBe(2);
        expect(report.averageExpense).toBe(62.5);
        done();
      });
    });

    it('should exclude deleted expenses', (done) => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const expenses = [
        {
          ...TestDataFactory.createExpense(),
          date: new Date('2024-01-10'),
          amount: 50,
          deletedAt: undefined,
        },
        {
          ...TestDataFactory.createExpense(),
          date: new Date('2024-01-15'),
          amount: 75,
          deletedAt: new Date('2024-01-16'),
        },
      ];

      mockExpenseService.getData$.and.returnValue(of(expenses as any));

      service.getExpenseReport(period).subscribe((report) => {
        expect(report.totalExpenses).toBe(50);
        expect(report.expenseCount).toBe(1);
        done();
      });
    });
  });

  describe('getProfitLossReport', () => {
    it('should calculate profit/loss for a period', (done) => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const invoices = [
        {
          ...TestDataFactory.createInvoice(),
          issueDate: new Date('2024-01-15'),
          totalAmount: 300,
          paymentStatus: PaymentStatus.PAID,
        },
      ];

      const expenses = [
        {
          ...TestDataFactory.createExpense(),
          date: new Date('2024-01-10'),
          amount: 100,
        },
      ];

      mockInvoiceService.getData$.and.returnValue(of(invoices as any));
      mockExpenseService.getData$.and.returnValue(of(expenses as any));

      service.getProfitLossReport(period).subscribe((report) => {
        expect(report.totalRevenue).toBe(300);
        expect(report.totalExpenses).toBe(100);
        expect(report.netProfit).toBe(200);
        done();
      });
    });
  });
});
