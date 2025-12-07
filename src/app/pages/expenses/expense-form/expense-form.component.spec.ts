import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Expense } from '../../../core/models/expense.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { MobileService } from '../../../core/services/mobile.service';
import { ToastrService } from '../../../core/services/toastr.service';
import { ExpenseFormComponent } from './expense-form.component';

describe('ExpenseFormComponent', () => {
  let component: ExpenseFormComponent;
  let fixture: ComponentFixture<ExpenseFormComponent>;
  let mockExpenseService: jasmine.SpyObj<ExpenseService>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockMobileService: jasmine.SpyObj<MobileService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  const mockExpense: Expense = {
    id: 'expense-123',
    description: 'New Scissors',
    amount: 150,
    date: new Date(),
    type: 'EQUIPMENT',
    notes: 'High quality',
  };

  beforeEach(async () => {
    mockExpenseService = jasmine.createSpyObj('ExpenseService', [
      'getById',
      'add',
      'update',
    ]);
    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', [
      'setItems',
    ]);
    mockMobileService = jasmine.createSpyObj('MobileService', [], {
      isMobile: false,
    });
    mockToastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockConfirmationDialogService = jasmine.createSpyObj(
      'ConfirmationDialogService',
      ['open'],
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
      imports: [ExpenseFormComponent, ReactiveFormsModule],
      providers: [
        { provide: ExpenseService, useValue: mockExpenseService },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        { provide: MobileService, useValue: mockMobileService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseFormComponent);
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

    it('should call add expense on submit', fakeAsync(() => {
      mockExpenseService.add.and.returnValue(of(mockExpense));

      component.form.patchValue({
        description: 'New Scissors',
        amount: 150,
        date: new Date(),
        type: 'EQUIPMENT',
      });

      component.submit();
      tick(100);

      expect(mockExpenseService.add).toHaveBeenCalled();
    }));
  });

  describe('Edit mode', () => {
    beforeEach(async () => {
      (
        mockActivatedRoute.snapshot!.paramMap.get as jasmine.Spy
      ).and.returnValue('expense-123');
      (
        mockActivatedRoute.snapshot!.paramMap.has as jasmine.Spy
      ).and.returnValue(true);
      mockExpenseService.getById.and.returnValue(of(mockExpense));

      fixture = TestBed.createComponent(ExpenseFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
    });

    it('should load expense data', () => {
      expect(mockExpenseService.getById).toHaveBeenCalledWith('expense-123');
      expect(component.form.get('description')?.value).toBe('New Scissors');
    });

    it('should call update expense on submit', fakeAsync(() => {
      mockExpenseService.update.and.returnValue(of(mockExpense));

      component.submit();
      tick(100);

      expect(mockExpenseService.update).toHaveBeenCalled();
    }));
  });
});
