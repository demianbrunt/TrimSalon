import { Component, input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * ValidationMessageComponent
 *
 * Herbruikbare component voor het tonen van form validatie fouten.
 * Toont automatisch de juiste foutmelding gebaseerd op het type validatie error.
 *
 * @example
 * <app-validation-message [control]="form.get('email')" label="E-mail" />
 *
 * Of met FormGroup:
 * <app-validation-message [control]="form.controls.email" label="E-mail" />
 */
@Component({
  selector: 'app-validation-message',
  standalone: true,
  template: `
    @if (control()?.invalid && (control()?.dirty || control()?.touched)) {
      <small class="text-red-500 block mt-1">
        {{ getErrorMessage() }}
      </small>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ValidationMessageComponent {
  /** The form control to validate */
  control = input<AbstractControl | null>(null);

  /** Label for the field (used in error messages) */
  label = input<string>('Dit veld');

  /** Custom error messages (override defaults) */
  customMessages = input<Record<string, string>>({});

  /**
   * Get the appropriate error message based on validation errors
   */
  getErrorMessage(): string {
    const ctrl = this.control();
    if (!ctrl?.errors) return '';

    const errors: ValidationErrors = ctrl.errors;
    const fieldLabel = this.label();
    const custom = this.customMessages();

    // Check for custom messages first
    for (const errorKey of Object.keys(errors)) {
      if (custom[errorKey]) {
        return custom[errorKey];
      }
    }

    // Default error messages (Dutch)
    if (errors['required']) {
      return `${fieldLabel} is verplicht`;
    }

    if (errors['email']) {
      return `Voer een geldig e-mailadres in`;
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `${fieldLabel} moet minimaal ${requiredLength} karakters bevatten`;
    }

    if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return `${fieldLabel} mag maximaal ${requiredLength} karakters bevatten`;
    }

    if (errors['min']) {
      const min = errors['min'].min;
      return `${fieldLabel} moet minimaal ${min} zijn`;
    }

    if (errors['max']) {
      const max = errors['max'].max;
      return `${fieldLabel} mag maximaal ${max} zijn`;
    }

    if (errors['pattern']) {
      return `${fieldLabel} heeft een ongeldig formaat`;
    }

    if (errors['phone']) {
      return `Voer een geldig telefoonnummer in`;
    }

    // Generic fallback
    return `${fieldLabel} is ongeldig`;
  }
}
