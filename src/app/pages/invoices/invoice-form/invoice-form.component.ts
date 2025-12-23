import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { firstValueFrom } from 'rxjs';

import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { ValidationMessageComponent } from '../../../core/components/validation-message/validation-message.component';
import { Client } from '../../../core/models/client.model';
import { Invoice, PaymentStatus } from '../../../core/models/invoice.model';
import { AppSettingsService } from '../../../core/services/app-settings.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ClientService } from '../../../core/services/client.service';
import { InvoiceService } from '../../../core/services/invoice.service';

/**
 * Typed form interface for Invoice
 */
interface InvoiceFormControls {
  invoiceNumber: FormControl<string>;
  client: FormControl<Client | null>;
  subtotal: FormControl<number>;
  vatRate: FormControl<number>;
  vatAmount: FormControl<number>;
  totalAmount: FormControl<number>;
  paymentStatus: FormControl<PaymentStatus>;
  issueDate: FormControl<Date>;
  dueDate: FormControl<Date>;
  paidDate: FormControl<Date | null>;
  notes: FormControl<string>;
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    Textarea,
    SelectModule,
    FloatLabelModule,
    DatePicker,
    CardModule,
    ValidationMessageComponent,
  ],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css'],
})
export class InvoiceFormComponent extends FormBaseComponent implements OnInit {
  override form!: FormGroup<InvoiceFormControls>;
  clients: Client[] = [];

  paymentStatuses = [
    { label: 'Openstaand', value: PaymentStatus.PENDING },
    { label: 'Betaald', value: PaymentStatus.PAID },
    { label: 'Achterstallig', value: PaymentStatus.OVERDUE },
    { label: 'Geannuleerd', value: PaymentStatus.CANCELLED },
  ];

  private readonly destroyRef = inject(DestroyRef);
  private readonly invoiceService = inject(InvoiceService);
  private readonly clientService = inject(ClientService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly appSettingsService = inject(AppSettingsService);

  ngOnInit(): void {
    this.breadcrumbService.setItems([
      { label: 'Facturen', routerLink: '/invoices' },
      { label: this.isEditMode ? 'Bewerken' : 'Nieuw' },
    ]);

    this.initForm();
  }

  /**
   * Initialize form with typed controls and setup value change listeners
   */
  async initForm(): Promise<void> {
    this.form = new FormGroup<InvoiceFormControls>({
      invoiceNumber: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      client: new FormControl<Client | null>(null, {
        validators: [Validators.required],
      }),
      subtotal: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
      vatRate: new FormControl(0, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(0),
          Validators.max(100),
        ],
      }),
      vatAmount: new FormControl(
        { value: 0, disabled: true },
        { nonNullable: true },
      ),
      totalAmount: new FormControl(
        { value: 0, disabled: true },
        { nonNullable: true },
      ),
      paymentStatus: new FormControl(PaymentStatus.PENDING, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      issueDate: new FormControl(new Date(), {
        nonNullable: true,
        validators: [Validators.required],
      }),
      dueDate: new FormControl(this.getDefaultDueDate(), {
        nonNullable: true,
        validators: [Validators.required],
      }),
      paidDate: new FormControl<Date | null>(null),
      notes: new FormControl('', { nonNullable: true }),
    });

    this.setupValueChangeListeners();

    this.appSettingsService.settings$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((settings) => {
        if (this.isEditMode) {
          return;
        }

        const vatRate = settings.korEnabled ? 0 : settings.defaultVatRate;
        if (!this.form.controls.vatRate.dirty) {
          this.form.controls.vatRate.setValue(vatRate);
        }

        if (settings.korEnabled) {
          this.form.controls.vatRate.disable({ emitEvent: false });
        } else {
          this.form.controls.vatRate.enable({ emitEvent: false });
        }
      });

    await this.loadData();
  }

  /**
   * Setup reactive listeners for calculated fields
   * Uses takeUntilDestroyed for automatic cleanup
   */
  private setupValueChangeListeners(): void {
    // Calculate VAT and total when subtotal or VAT rate changes
    this.form.controls.subtotal.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.calculateTotals());

    this.form.controls.vatRate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.calculateTotals());

    // Auto-set paid date to today when status changes to PAID
    this.form.controls.paymentStatus.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        if (
          status === PaymentStatus.PAID &&
          !this.form.controls.paidDate.value
        ) {
          this.form.controls.paidDate.setValue(new Date());
        }
      });
  }

  /**
   * Load clients and invoice data (if editing)
   */
  private async loadData(): Promise<void> {
    try {
      this.clients = await firstValueFrom(this.clientService.getData$());

      if (this.isEditMode && this.routeIdParam) {
        const invoice = await firstValueFrom(
          this.invoiceService.getById(this.routeIdParam as string),
        );
        this.form.patchValue(invoice);
      }

      // Form is ready after data loaded
      this.isInitialized = true;
      this.isLoading = false;
    } catch (err) {
      this.toastr.error('Fout', (err as Error).message);
    }
  }

  /**
   * Called by FormBaseComponent.submit() after validation passes
   */
  async afterValidityEnsured(): Promise<void> {
    const formValue = this.form.getRawValue();

    const invoice: Invoice = {
      ...formValue,
      items: [], // Simplified - no line items for now
      id: this.routeIdParam as string | undefined,
    };

    try {
      if (this.isEditMode) {
        await firstValueFrom(this.invoiceService.update(invoice));
      } else {
        await firstValueFrom(this.invoiceService.add(invoice));
      }

      this.finalizeSaveSuccess();
      this.toastr.success(
        'Succes',
        `Factuur ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
      );
      this.router.navigate(['/invoices']);
    } catch (err) {
      this.toastr.error('Fout', (err as Error).message);
    }
  }

  /**
   * Calculate VAT amount and total from subtotal and VAT rate
   */
  private calculateTotals(): void {
    const subtotal = this.form.controls.subtotal.value || 0;
    const vatRate = this.form.controls.vatRate.value || 0;
    const vatAmount = (subtotal * vatRate) / 100;
    const totalAmount = subtotal + vatAmount;

    this.form.patchValue({ vatAmount, totalAmount }, { emitEvent: false });
  }

  /**
   * Get default due date (30 days from today)
   */
  private getDefaultDueDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }
}
