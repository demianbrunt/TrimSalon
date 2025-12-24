import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom, take } from 'rxjs';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import {
  PullToRefreshDirective,
  PullToRefreshEvent,
} from '../../core/directives/pull-to-refresh.directive';
import { SwipeDirective } from '../../core/directives/swipe.directive';
import { Expense, ExpenseType } from '../../core/models/expense.model';
import { AppDialogService } from '../../core/services/app-dialog.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { ExpenseService } from '../../core/services/expense.service';
import { MobileService } from '../../core/services/mobile.service';
import { ToastrService } from '../../core/services/toastr.service';
import {
  readNumberParam,
  readStringParam,
  sanitizePage,
  toQueryParams,
} from '../../core/utils/list-query-params';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DataViewModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    TagModule,
    TooltipModule,
    CardModule,
    TableHeaderComponent,
    PullToRefreshDirective,
    SwipeDirective,
  ],
  providers: [],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css'],
})
export class ExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  selectedExpense: Expense | null = null;
  sortField = 'date';
  sortOrder = -1;
  scrollableHeight = '50vh';
  totalExpenses = 0;

  searchQuery = '';
  page = 1;
  readonly mobileRows = 9;
  desktopRows = 10;

  get isMobile() {
    return this.mobileService.isMobile;
  }

  private readonly expenseService = inject(ExpenseService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationDialogService = inject(
    ConfirmationDialogService,
  );
  private readonly dialogService = inject(AppDialogService);

  ngOnInit(): void {
    const queryParamMap = this.route.snapshot.queryParamMap;
    this.searchQuery = readStringParam(queryParamMap, 'q', '');
    this.page = sanitizePage(readNumberParam(queryParamMap, 'page', 1));
    this.desktopRows = Math.max(
      1,
      Math.floor(readNumberParam(queryParamMap, 'rows', this.desktopRows)),
    );

    this.breadcrumbService.setItems([{ label: 'Uitgaven' }]);
    this.loadExpenses();
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.page = 1;
    this.updateListQueryParams();
  }

  onMobilePage(event: { page?: number; first?: number; rows?: number }): void {
    const nextPage =
      typeof event.page === 'number'
        ? event.page + 1
        : typeof event.first === 'number' && typeof event.rows === 'number'
          ? Math.floor(event.first / event.rows) + 1
          : 1;
    this.page = sanitizePage(nextPage);
    this.updateListQueryParams();
  }

  onDesktopPage(event: { page?: number; first?: number; rows?: number }): void {
    if (typeof event.rows === 'number' && Number.isFinite(event.rows)) {
      this.desktopRows = Math.max(1, Math.floor(event.rows));
    }
    this.onMobilePage(event);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.page = 1;
    this.updateListQueryParams();
  }

  onListSwipe(direction: 'left' | 'right'): void {
    if (!this.isMobile) return;
    if (this.searchQuery.trim().length > 0) return;

    const maxPage = Math.max(
      1,
      Math.ceil(this.expenses.length / this.mobileRows),
    );
    const nextPage = direction === 'left' ? this.page + 1 : this.page - 1;
    const clamped = Math.max(1, Math.min(maxPage, nextPage));
    if (clamped === this.page) return;

    this.page = clamped;
    this.updateListQueryParams();
  }

  private updateListQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams({
        q: this.searchQuery,
        page: this.page,
        rows: this.desktopRows,
      }),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  loadExpenses(): void {
    this.expenseService.getData$().subscribe((expenses) => {
      this.expenses = expenses.filter((e) => !e.deletedAt);
      this.calculateTotalExpenses();
    });
  }

  async onPullToRefresh(evt: PullToRefreshEvent): Promise<void> {
    try {
      const expenses = await firstValueFrom(
        this.expenseService.getData$().pipe(take(1)),
      );
      this.expenses = expenses.filter((e) => !e.deletedAt);
      this.calculateTotalExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vernieuwen mislukt';
      this.toastrService.error('Fout', message);
    } finally {
      evt.complete();
    }
  }

  calculateTotalExpenses(): void {
    this.totalExpenses = this.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
  }

  createExpense(): void {
    this.router.navigate(['/expenses/new'], {
      queryParamsHandling: 'preserve',
    });
  }

  editExpense(expense: Expense): void {
    this.router.navigate(['/expenses', expense.id], {
      queryParamsHandling: 'preserve',
    });
  }

  deleteExpense(expense: Expense): void {
    this.confirmationDialogService
      .open(
        'Uitgave Verwijderen',
        `Weet je zeker dat je "${expense.description}" wilt verwijderen?`,
      )
      .then((confirmed) => {
        if (confirmed && expense.id) {
          const updated = { ...expense, deletedAt: new Date() };
          this.expenseService.update(updated).subscribe({
            next: () => {
              this.toastrService.success('Succes', 'Uitgave verwijderd');
              this.loadExpenses();
            },
            error: (err) => {
              this.toastrService.error('Fout', err.message);
            },
          });
        }
      });
  }

  getExpenseTypeLabel(type: ExpenseType): string {
    const labels = {
      INVESTMENT: 'Investering',
      EQUIPMENT: 'Apparatuur',
      COURSE: 'Cursus',
      OTHER: 'Overig',
    };
    return labels[type] || type;
  }

  getExpenseTypeSeverity(
    type: ExpenseType,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities = {
      INVESTMENT: 'info' as const,
      EQUIPMENT: 'success' as const,
      COURSE: 'warn' as const,
      OTHER: 'secondary' as const,
    };
    return severities[type] || 'secondary';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('nl-NL');
  }
}
