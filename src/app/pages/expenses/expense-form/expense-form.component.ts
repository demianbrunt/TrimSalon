import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { firstValueFrom } from 'rxjs';

import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { ValidationMessageComponent } from '../../../core/components/validation-message/validation-message.component';
import { Expense, ExpenseType } from '../../../core/models/expense.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { MobileService } from '../../../core/services/mobile.service';

/**
 * Typed form interface for Expense
 */
interface ExpenseFormControls {
  id: FormControl<string | null>;
  description: FormControl<string>;
  amount: FormControl<number | null>;
  date: FormControl<Date>;
  type: FormControl<ExpenseType>;
  notes: FormControl<string>;
}

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    FloatLabelModule,
    SelectModule,
    DatePickerModule,
    CardModule,
    ValidationMessageComponent,
  ],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.css'],
})
export class ExpenseFormComponent extends FormBaseComponent implements OnInit {
  override form!: FormGroup<ExpenseFormControls>;

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
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

  ngOnInit(): void {
    this.breadcrumbService.setItems([
      { label: 'Uitgaven', routerLink: '/expenses' },
      { label: this.isEditMode ? 'Bewerken' : 'Nieuwe Uitgave' },
    ]);

    this.initForm();
  }

  /**
   * Initialize form with typed controls
   */
  async initForm(): Promise<void> {
    this.form = new FormGroup<ExpenseFormControls>({
      id: new FormControl<string | null>(null),
      description: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      amount: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      date: new FormControl(new Date(), {
        nonNullable: true,
        validators: [Validators.required],
      }),
      type: new FormControl<ExpenseType>('COURSE', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      notes: new FormControl('', { nonNullable: true }),
    });

    if (this.isEditMode && this.routeIdParam) {
      await this.loadExpenseData(this.routeIdParam as string);
    } else {
      // Create mode - form is ready
      this.isInitialized = true;
      this.isLoading = false;
    }
  }

  /**
   * Load expense data for editing
   */
  private async loadExpenseData(id: string): Promise<void> {
    try {
      const expense = await firstValueFrom(this.expenseService.getById(id));
      if (expense) {
        this.form.patchValue(expense);
        this.breadcrumbService.setItems([
          { label: 'Uitgaven', routerLink: '/expenses' },
          { label: expense.description },
        ]);

        // Edit mode - form is ready after data loaded
        this.isInitialized = true;
        this.isLoading = false;
      } else {
        this.router.navigate(['/not-found']);
      }
    } catch (err) {
      this.toastr.error('Fout', (err as Error).message);
    }
  }

  /**
   * Called by FormBaseComponent.submit() after validation passes
   */
  async afterValidityEnsured(): Promise<void> {
    const formValue = this.form.getRawValue();

    const expenseData: Expense = {
      id: formValue.id || undefined,
      description: formValue.description,
      amount: formValue.amount!,
      date: formValue.date,
      type: formValue.type,
      notes: formValue.notes || undefined,
    };

    try {
      if (this.isEditMode) {
        await firstValueFrom(this.expenseService.update(expenseData));
      } else {
        await firstValueFrom(this.expenseService.add(expenseData));
      }

      this.finalizeSaveSuccess();
      this.toastr.success(
        'Succes',
        `Uitgave ${this.isEditMode ? 'bijgewerkt' : 'toegevoegd'}`,
      );
      this.router.navigate(['/expenses'], {
        queryParamsHandling: 'preserve',
      });
    } catch (err) {
      this.toastr.error('Fout', (err as Error).message);
    }
  }

  override cancel() {
    return super.cancel().then((confirmed) => {
      if (confirmed) {
        this.router.navigate(['/expenses'], {
          queryParamsHandling: 'preserve',
        });
      }
      return confirmed;
    });
  }
}
