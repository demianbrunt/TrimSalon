import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CanDeactivateComponent } from '../../../core/components/can-deactivate/can-deactivate.component';
import { Client } from '../../../core/models/client.model';
import { Invoice, PaymentStatus } from '../../../core/models/invoice.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ClientService } from '../../../core/services/client.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ToastrService } from '../../../core/services/toastr.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    Textarea,
    SelectModule,
    FloatLabelModule,
    DatePicker,
    CardModule,
  ],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css'],
})
export class InvoiceFormComponent implements OnInit, CanDeactivateComponent {
  form!: FormGroup;
  clients: Client[] = [];
  paymentStatuses = [
    { label: 'Openstaand', value: PaymentStatus.PENDING },
    { label: 'Betaald', value: PaymentStatus.PAID },
    { label: 'Achterstallig', value: PaymentStatus.OVERDUE },
    { label: 'Geannuleerd', value: PaymentStatus.CANCELLED },
  ];

  isSaving = false;
  itemId?: string;
  isEditMode = false;
  hasUnsavedChanges = false;

  private readonly fb = inject(FormBuilder);
  private readonly invoiceService = inject(InvoiceService);
  private readonly clientService = inject(ClientService);
  private readonly toastrService = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly confirmationDialogService = inject(
    ConfirmationDialogService,
  );

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.itemId;

    this.breadcrumbService.setItems([
      { label: 'Facturen', routerLink: '/invoices' },
      { label: this.isEditMode ? 'Bewerken' : 'Nieuw' },
    ]);

    this.initializeForm();
    this.loadData();

    // Track form changes
    this.form.valueChanges.subscribe(() => {
      this.hasUnsavedChanges = true;
    });
  }

  initializeForm(): void {
    this.form = this.fb.group({
      invoiceNumber: ['', Validators.required],
      client: [null, Validators.required],
      subtotal: [0, [Validators.required, Validators.min(0)]],
      vatRate: [
        21,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      vatAmount: [{ value: 0, disabled: true }],
      totalAmount: [{ value: 0, disabled: true }],
      paymentStatus: [PaymentStatus.PENDING, Validators.required],
      issueDate: [new Date(), Validators.required],
      dueDate: [this.getDefaultDueDate(), Validators.required],
      paidDate: [null],
      notes: [''],
    });

    // Calculate VAT and total when subtotal or VAT rate changes
    this.form.get('subtotal')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
    this.form.get('vatRate')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  loadData(): void {
    this.clientService.getData$().subscribe({
      next: (clients) => {
        this.clients = clients;
      },
      error: (err) => {
        this.toastrService.error('Fout', err.message);
      },
    });

    if (this.isEditMode && this.itemId) {
      this.invoiceService.getById(this.itemId).subscribe({
        next: (invoice) => {
          this.form.patchValue(invoice);
        },
        error: (err) => {
          this.toastrService.error('Fout', err.message);
        },
      });
    }
  }

  save(): void {
    if (this.form.valid) {
      this.isSaving = true;
      const formValue = this.form.getRawValue();

      const invoice: Invoice = {
        ...formValue,
        items: [], // Simplified - no line items for now
        id: this.itemId,
      };

      const saveObservable = this.isEditMode
        ? this.invoiceService.update(invoice)
        : this.invoiceService.add(invoice);

      saveObservable.subscribe({
        next: () => {
          this.toastrService.success(
            'Succes',
            `Factuur ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
          );
          this.hasUnsavedChanges = false;
          this.router.navigate(['/invoices']);
        },
        error: (err) => {
          this.toastrService.error('Fout', err.message);
          this.isSaving = false;
        },
      });
    } else {
      this.toastrService.error('Fout', 'Vul alle verplichte velden in');
    }
  }

  cancel(): void {
    if (this.form.dirty) {
      this.confirmationDialogService
        .open(
          'Wijzigingen annuleren',
          'Weet je zeker dat je wilt annuleren? De gemaakte wijzigingen zullen verloren gaan.',
        )
        .then((confirmed) => {
          if (confirmed) {
            this.router.navigate(['/invoices']);
          }
        });
    } else {
      this.router.navigate(['/invoices']);
    }
  }

  canDeactivate(): Promise<boolean> {
    if (this.form.dirty && this.hasUnsavedChanges) {
      return this.confirmationDialogService.open(
        'Openstaande wijzigingen',
        '<b>Let op!</b> Vergeten op te slaan? Als je doorgaat zullen de niet opgeslagen wijzigingen verloren gaan.',
      );
    }
    return Promise.resolve(true);
  }

  private calculateTotals(): void {
    const subtotal = this.form.get('subtotal')?.value || 0;
    const vatRate = this.form.get('vatRate')?.value || 0;
    const vatAmount = (subtotal * vatRate) / 100;
    const totalAmount = subtotal + vatAmount;

    this.form.patchValue(
      {
        vatAmount,
        totalAmount,
      },
      { emitEvent: false },
    );
  }

  private getDefaultDueDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date;
  }
}
