import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PullToRefreshEvent } from '../../core/directives/pull-to-refresh.directive';
import { Expense } from '../../core/models/expense.model';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { ExpenseService } from '../../core/services/expense.service';
import { MobileService } from '../../core/services/mobile.service';
import { ToastrService } from '../../core/services/toastr.service';
import { ExpensesComponent } from './expenses.component';

describe('ExpensesComponent', () => {
  let component: ExpensesComponent;
  let fixture: ComponentFixture<ExpensesComponent>;

  let mockExpenseService: jasmine.SpyObj<ExpenseService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockMobileService: { isMobile: boolean };

  let mockActivatedRoute: Partial<ActivatedRoute>;
  let queryGetSpy: jasmine.Spy;

  const activeExpenses: Expense[] = [
    {
      id: 'e1',
      description: 'Shampoo',
      amount: 10,
      date: new Date('2025-01-01T00:00:00.000Z'),
      type: 'OTHER',
    },
    {
      id: 'e2',
      description: 'Tondeuse',
      amount: 200,
      date: new Date('2025-01-02T00:00:00.000Z'),
      type: 'EQUIPMENT',
    },
  ];

  const withDeleted: Expense[] = [
    ...activeExpenses,
    {
      id: 'e3',
      description: 'Oud',
      amount: 999,
      date: new Date('2024-12-31T00:00:00.000Z'),
      type: 'OTHER',
      deletedAt: new Date('2025-01-03T00:00:00.000Z'),
    },
  ];

  beforeEach(async () => {
    mockExpenseService = jasmine.createSpyObj('ExpenseService', [
      'getData$',
      'update',
    ]);
    mockToastrService = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
    ]);
    mockConfirmationDialogService = jasmine.createSpyObj(
      'ConfirmationDialogService',
      ['open'],
    );
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', [
      'setItems',
    ]);
    mockMobileService = { isMobile: false };

    queryGetSpy = jasmine.createSpy('get').and.returnValue(null);
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: queryGetSpy,
        },
      } as unknown,
    } as Partial<ActivatedRoute>;

    mockRouter.navigate.and.resolveTo(true);
    mockExpenseService.getData$.and.returnValue(of(withDeleted));

    await TestBed.configureTestingModule({
      imports: [ExpensesComponent],
      providers: [
        { provide: ExpenseService, useValue: mockExpenseService },
        { provide: ToastrService, useValue: mockToastrService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        { provide: MobileService, useValue: mockMobileService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should read query params, set breadcrumb, and load expenses', () => {
      queryGetSpy.and.callFake((key: string) => {
        switch (key) {
          case 'q':
            return 'test';
          case 'page':
            return '2';
          case 'rows':
            return '25';
          default:
            return null;
        }
      });

      fixture.detectChanges();

      expect(component.searchQuery).toBe('test');
      expect(component.page).toBe(2);
      expect(component.desktopRows).toBe(25);

      expect(mockBreadcrumbService.setItems).toHaveBeenCalledWith([
        { label: 'Uitgaven' },
      ]);

      expect(mockExpenseService.getData$).toHaveBeenCalled();
      expect(component.expenses).toEqual(activeExpenses);
      expect(component.totalExpenses).toBe(210);
    });

    it('should sanitize invalid page and rows', () => {
      queryGetSpy.and.callFake((key: string) => {
        if (key === 'page') return '0';
        if (key === 'rows') return '0.2';
        return null;
      });

      fixture.detectChanges();

      expect(component.page).toBe(1);
      expect(component.desktopRows).toBe(1);
    });
  });

  describe('loadExpenses', () => {
    it('should filter deleted expenses and calculate total', () => {
      component.loadExpenses();
      expect(component.expenses).toEqual(activeExpenses);
      expect(component.totalExpenses).toBe(210);
    });
  });

  describe('onPullToRefresh', () => {
    it('should refresh list and call complete on success', async () => {
      const complete = jasmine.createSpy('complete');
      const evt: PullToRefreshEvent = { complete };

      await component.onPullToRefresh(evt);

      expect(component.expenses).toEqual(activeExpenses);
      expect(component.totalExpenses).toBe(210);
      expect(complete).toHaveBeenCalled();
    });

    it('should show toast on error and still call complete', async () => {
      const complete = jasmine.createSpy('complete');
      mockExpenseService.getData$.and.returnValue(
        throwError(() => new Error('kapot')),
      );

      const evt: PullToRefreshEvent = { complete };
      await component.onPullToRefresh(evt);

      expect(mockToastrService.error).toHaveBeenCalledWith('Fout', 'kapot');
      expect(complete).toHaveBeenCalled();
    });
  });

  describe('filters & paging', () => {
    it('onSearchQueryChange should reset page and update query params', () => {
      component.page = 5;
      component.desktopRows = 10;

      component.onSearchQueryChange('abc');

      expect(component.searchQuery).toBe('abc');
      expect(component.page).toBe(1);
      expect(mockRouter.navigate).toHaveBeenCalled();

      const navArgs = mockRouter.navigate.calls.mostRecent().args;
      const extras = navArgs[1] as unknown as NavigationExtras;
      expect(extras.queryParams).toEqual({
        q: 'abc',
        page: '1',
        rows: '10',
      });
    });

    it('onMobilePage should calculate page from event.page', () => {
      component.onMobilePage({ page: 2 });
      expect(component.page).toBe(3);
    });

    it('onMobilePage should calculate page from first/rows', () => {
      component.onMobilePage({ first: 18, rows: 9 });
      expect(component.page).toBe(3);
    });

    it('onDesktopPage should update desktopRows and delegate to onMobilePage', () => {
      spyOn(component, 'onMobilePage');

      component.onDesktopPage({ page: 0, rows: 20 });

      expect(component.desktopRows).toBe(20);
      expect(component.onMobilePage).toHaveBeenCalledWith({
        page: 0,
        rows: 20,
      });
    });

    it('resetFilters should reset query and page, then update query params', () => {
      component.searchQuery = 'zoek';
      component.page = 3;

      component.resetFilters();

      expect(component.searchQuery).toBe('');
      expect(component.page).toBe(1);
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('onListSwipe should do nothing when not mobile or when searching', () => {
      mockMobileService.isMobile = false;
      component.page = 1;
      component.expenses = activeExpenses;

      component.onListSwipe('left');
      expect(component.page).toBe(1);

      mockMobileService.isMobile = true;
      component.searchQuery = 'zoek';
      component.onListSwipe('left');
      expect(component.page).toBe(1);
    });

    it('onListSwipe should clamp page on mobile when not searching', () => {
      mockMobileService.isMobile = true;
      component.searchQuery = '';
      component.expenses = Array.from({ length: 20 }, (_, i) => ({
        id: `e${i}`,
        description: `E${i}`,
        amount: 1,
        date: new Date('2025-01-01T00:00:00.000Z'),
        type: 'OTHER',
      }));

      component.page = 1;
      component.onListSwipe('right');
      expect(component.page).toBe(1);

      component.onListSwipe('left');
      expect(component.page).toBe(2);

      component.page = 3;
      component.onListSwipe('left');
      expect(component.page).toBe(3);
    });
  });

  describe('navigation', () => {
    it('createExpense should navigate to new', () => {
      component.createExpense();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/expenses/new'], {
        queryParamsHandling: 'preserve',
      });
    });

    it('editExpense should navigate to edit', () => {
      component.editExpense(activeExpenses[0]);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/expenses', 'e1'], {
        queryParamsHandling: 'preserve',
      });
    });
  });

  describe('deleteExpense', () => {
    it('should do nothing when not confirmed', fakeAsync(() => {
      mockConfirmationDialogService.open.and.resolveTo(false);

      component.deleteExpense(activeExpenses[0]);
      tick();

      expect(mockExpenseService.update).not.toHaveBeenCalled();
    }));

    it('should update deletedAt when confirmed', fakeAsync(() => {
      spyOn(component, 'loadExpenses');
      mockConfirmationDialogService.open.and.resolveTo(true);
      mockExpenseService.update.and.callFake((e: Expense) => of(e));

      component.deleteExpense(activeExpenses[0]);
      tick();

      expect(mockExpenseService.update).toHaveBeenCalled();
      const updated = mockExpenseService.update.calls.mostRecent()
        .args[0] as Expense;
      expect(updated.id).toBe('e1');
      expect(updated.deletedAt instanceof Date).toBeTrue();

      expect(mockToastrService.success).toHaveBeenCalledWith(
        'Succes',
        'Uitgave verwijderd',
      );
      expect(component.loadExpenses).toHaveBeenCalled();
    }));

    it('should show toast when update fails', fakeAsync(() => {
      mockConfirmationDialogService.open.and.resolveTo(true);
      mockExpenseService.update.and.returnValue(
        throwError(() => new Error('mislukt')),
      );

      component.deleteExpense(activeExpenses[0]);
      tick();

      expect(mockToastrService.error).toHaveBeenCalledWith('Fout', 'mislukt');
    }));
  });

  describe('labeling & formatting', () => {
    it('getExpenseTypeLabel should return Dutch labels', () => {
      expect(component.getExpenseTypeLabel('INVESTMENT')).toBe('Investering');
      expect(component.getExpenseTypeLabel('EQUIPMENT')).toBe('Apparatuur');
      expect(component.getExpenseTypeLabel('COURSE')).toBe('Cursus');
      expect(component.getExpenseTypeLabel('OTHER')).toBe('Overig');
    });

    it('getExpenseTypeSeverity should return expected severities', () => {
      expect(component.getExpenseTypeSeverity('INVESTMENT')).toBe('info');
      expect(component.getExpenseTypeSeverity('EQUIPMENT')).toBe('success');
      expect(component.getExpenseTypeSeverity('COURSE')).toBe('warn');
      expect(component.getExpenseTypeSeverity('OTHER')).toBe('secondary');
    });

    it('formatCurrency should return EUR formatted string', () => {
      const out = component.formatCurrency(12.5);
      expect(out).toContain('€');
      expect(out).toContain('12');
    });

    it('formatDate should return Dutch date string', () => {
      const out = component.formatDate(new Date('2025-12-24T00:00:00.000Z'));
      expect(out).toContain('2025');
    });
  });
});
