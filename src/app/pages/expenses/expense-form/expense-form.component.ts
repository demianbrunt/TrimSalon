import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { Expense, ExpenseType } from '../../../core/models/expense.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { MobileService } from '../../../core/services/mobile.service';
import { ToastrService } from '../../../core/services/toastr.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    FloatLabelModule,
    SelectModule,
    DatePickerModule,
    ToastModule,
    CardModule,
  ],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.css'],
})
export class ExpenseFormComponent extends FormBaseComponent implements OnInit {
  override form: FormGroup<{
    id: FormControl<string | null>;
    description: FormControl<string | null>;
    amount: FormControl<number | null>;
    date: FormControl<Date | null>;
    type: FormControl<ExpenseType | null>;
    notes: FormControl<string | null>;
  }>;

  expenseTypes: { label: string; value: ExpenseType }[] = [
    { label: 'Cursus', value: 'COURSE' },
    { label: 'Apparatuur', value: 'EQUIPMENT' },
    { label: 'Investering', value: 'INVESTMENT' },
    { label: 'Overig', value: 'OTHER' },
  ];

  get isMobile() {
    return this.mobileService.isMobile;
  }

  private readonly expenseService = inject(ExpenseService);
  private readonly toastrService = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

  constructor() {
    super();
  }

  override afterValidityEnsured(): Promise<void> {
    return Promise.resolve();
  }

  override initForm(): Promise<void> {
    return new Promise((resolve) => {
      this.form = this.fb.group({
        id: new FormControl(null),
        description: new FormControl(null, Validators.required),
        amount: new FormControl<number | null>(null, [
          Validators.required,
          Validators.min(0),
        ]),
        date: new FormControl<Date | null>(new Date(), Validators.required),
        type: new FormControl<ExpenseType | null>(
          'COURSE',
          Validators.required,
        ),
        notes: new FormControl(null),
      });
      resolve();
    });
  }

  ngOnInit(): void {
    this.initForm();

    if (this.isEditMode) {
      const expenseId = this.route.snapshot.paramMap.get('id');
      this.form.controls.id.patchValue(expenseId);
      this.loadExpenseData(expenseId);
      return;
    }

    this.breadcrumbService.setItems([
      { label: 'Uitgaven', routerLink: '/expenses' },
      { label: 'Nieuwe Uitgave' },
    ]);
  }

  loadExpenseData(id: string): void {
    this.expenseService.getById(id).subscribe((expense) => {
      if (expense) {
        this.form.patchValue(expense);
        this.breadcrumbService.setItems([
          { label: 'Uitgaven', routerLink: '/expenses' },
          { label: expense.description },
        ]);
      } else {
        this.router.navigate(['/not-found']);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.toastrService.error('Fout', 'Vul alle verplichte velden in');
      return;
    }

    const formValue = this.form.value;
    const expenseData: Expense = {
      id: formValue.id || undefined,
      description: formValue.description!,
      amount: formValue.amount!,
      date: formValue.date!,
      type: formValue.type!,
      notes: formValue.notes || undefined,
    };

    const operation = this.isEditMode
      ? this.expenseService.update(expenseData)
      : this.expenseService.add(expenseData);

    operation.subscribe({
      next: () => {
        // Mark form as pristine to prevent CanDeactivate warning
        this.finalizeSaveSuccess();
        console.log('[ExpenseForm] ✨ Form finalized after save');

        this.toastrService.success(
          'Succes',
          `Uitgave ${this.isEditMode ? 'bijgewerkt' : 'toegevoegd'}`,
        );
        this.router.navigate(['/expenses']);
      },
      error: (err) => {
        this.toastrService.error('Fout', err.message);
      },
    });
  }

  override cancel() {
    return super.cancel().then((confirmed) => {
      if (confirmed) {
        this.router.navigate(['/expenses']);
      }
      return confirmed;
    });
  }
}
