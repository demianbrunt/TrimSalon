import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationDialogService } from '../../core/services/confirmation-dialog.service';
import { Expense, ExpenseType } from '../../core/models/expense.model';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ExpenseService } from '../../core/services/expense.service';
import { MobileService } from '../../core/services/mobile.service';
import { ToastrService } from '../../core/services/toastr.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule,
    CardModule,
  ],
  providers: [ConfirmationService],
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

  get isMobile() {
    return this.mobileService.isMobile;
  }

  private readonly expenseService = inject(ExpenseService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);
  private readonly router = inject(Router);
  private readonly toastrService = inject(ToastrService);
  private readonly confirmationDialogService = inject(ConfirmationDialogService);

  ngOnInit(): void {
    this.breadcrumbService.setItems([{ label: 'Uitgaven' }]);
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.expenseService.getData$().subscribe((expenses) => {
      this.expenses = expenses.filter((e) => !e.deletedAt);
      this.calculateTotalExpenses();
    });
  }

  calculateTotalExpenses(): void {
    this.totalExpenses = this.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
  }

  createExpense(): void {
    this.router.navigate(['/expenses/new']);
  }

  editExpense(expense: Expense): void {
    this.router.navigate(['/expenses', expense.id]);
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
