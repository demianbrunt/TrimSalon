import { Directive, HostListener, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { FormMode } from '../../enums/form-mode.enum';
import { ConfirmationDialogService } from '../../services/confirmation-dialog.service';
import { ToastrService } from '../../services/toastr.service';
import { BaseComponent } from '../base/base.component';
import { CanDeactivateComponent } from '../can-deactivate/can-deactivate.component';

/**
 * FormBaseComponent
 *
 * Basis component voor ALLE formulieren in de applicatie.
 * Extend deze class voor client-form, service-form, etc.
 *
 * FEATURES:
 * - Automatisch detecteert create vs edit mode (via route parameter 'id')
 * - Unsaved changes warning (canDeactivate guard)
 * - Form validation helper
 * - Standaard submit/cancel flow
 *
 * GEBRUIK:
 * 1. Extend deze class
 * 2. Implementeer abstract properties/methods
 * 3. Override methods indien nodig
 *
 * @example
 * export class ClientFormComponent extends FormBaseComponent {
 *   form = this.formBuilder.group({
 *     name: ['', Validators.required],
 *     email: ['', [Validators.required, Validators.email]]
 *   });
 *
 *   protected getFormMode(): FormMode {
 *     return this.routeIdParam ? FormMode.Edit : FormMode.Create;
 *   }
 *
 *   protected async afterValidityEnsured() {
 *     const client = this.form.value;
 *     // Save logic here
 *   }
 * }
 */
@Directive()
export abstract class FormBaseComponent
  extends BaseComponent
  implements CanDeactivateComponent
{
  routeIdParam: unknown; // ID uit route (bijv. /clients/123 → '123')
  isSaving = false; // Toon loading spinner tijdens save
  isCanceling = false; // Flag om canDeactivate te bypassen bij cancel

  private formMode: FormMode; // Create of Edit mode

  // Injected dependencies
  protected readonly formBuilder: FormBuilder = inject(FormBuilder);
  protected readonly toastr: ToastrService = inject(ToastrService);
  protected readonly confirmationService = inject(ConfirmationDialogService);
  protected readonly router: Router = inject(Router);

  /**
   * Het Angular FormGroup of FormArray
   * MOET geïmplementeerd worden in subclass
   */
  abstract form: FormGroup | FormArray;

  /**
   * Checkt of we in create mode zijn (geen ID in route)
   */
  get isCreateMode() {
    return this.formMode === FormMode.Create;
  }

  /**
   * Checkt of we in edit mode zijn (ID in route)
   */
  get isEditMode() {
    return this.formMode === FormMode.Edit;
  }

  constructor() {
    super();

    // Check of er een 'id' parameter in de route zit
    if (this.activatedRoute.snapshot.paramMap.has('id')) {
      this.routeIdParam = this.activatedRoute.snapshot.paramMap.get('id');
    }

    // Bepaal form mode (subclass kan getFormMode() overriden)
    this.formMode = this.getFormMode() ?? FormMode.Create;
  }

  /**
   * Submit handler
   * 1. Valideer form
   * 2. Roep afterValidityEnsured() aan (geïmplementeerd in subclass)
   * 3. Toon error bij validation failure
   */
  submit() {
    if (!this.isInitialized || this.isLoading) return;

    if (this.isSaving) {
      return; // Already saving, prevent double submit
    }
    this.isSaving = true;

    // Valideer form
    if (!this.ensureValidity()) {
      this.toastr.error('Oeps!', 'Heb je alles correct ingevoerd?');
      return;
    }

    // Save logic (geïmplementeerd in subclass)
    this.afterValidityEnsured()?.then(
      () => (this.isSaving = false),
      () => (this.isSaving = false),
    );
  }

  /**
   * CanDeactivate guard implementatie
   * Waarschuwt gebruiker bij unsaved changes
   *
   * GEBRUIKT DOOR: Angular Router CanDeactivate guard
   *
   * @returns Promise<boolean> - true als navigatie mag doorgaan
   */
  canDeactivate(): Promise<boolean> {
    // Als form dirty/touched is EN we cancelen niet
    if ((this?.form?.dirty || this?.form?.touched) && !this.isCanceling) {
      return this.confirmationService.open(
        'Openstaande wijzigingen',
        '<b>Let op!</b> Vergeten op te slaan? Als je doorgaat zullen de niet opgeslagen wijzigingen verloren gaan.',
      );
    }
    return new Promise((resolve) => resolve(true));
  }

  /**
   * Browser beforeunload handler
   * Waarschuwt ook bij browser refresh/close
   */
  @HostListener('window:beforeunload', ['$event'])
  protected unloadNotification($event: BeforeUnloadEvent) {
    // Check if form has unsaved changes (sync check, canDeactivate is async)
    if ((this?.form?.dirty || this?.form?.touched) && !this.isCanceling) {
      $event.returnValue = true;
    }
  }

  /**
   * Cancel handler
   * Navigeert terug zonder confirmation dialog
   */
  cancel() {
    this.isCanceling = true;
    if (this.form.pristine) {
      this.isCanceling = false;
      return Promise.resolve(true);
    }

    return this.confirmationService
      .open(
        'Wijzigingen annuleren',
        'Weet je zeker dat je wilt annuleren? De gemaakte wijzigingen zullen verloren gaan.',
      )
      .then((confirmed) => {
        // this.reloadComponent();
        if (confirmed) {
          this.toastr.success(
            'Wijzigingen ongedaan',
            'De wijzigingen zijn succesvol ongedaan gemaakt.',
          );
        }
        return confirmed;
      });
  }

  // Add validity checks here.
  ensureValidity(): boolean {
    return this?.form?.valid ?? false;
  }

  // After form has passed validity checks, do something here.
  abstract afterValidityEnsured(): Promise<void>;

  // Used for initializing form and validators.
  abstract initForm(): Promise<void>;

  private getFormMode() {
    if (this.activatedRoute.snapshot.data['formMode']) {
      return this.activatedRoute.snapshot.data['formMode'];
    } else if (this.routeIdParam) {
      return FormMode.Edit;
    } else {
      return FormMode.Create;
    }
  }

  protected setFormMode(mode: FormMode) {
    this.formMode = mode;
  }

  protected getRouteParam(param: string) {
    return this.activatedRoute.snapshot.paramMap.get(param);
  }

  protected getRouteParam$() {
    return this.activatedRoute.paramMap;
  }

  // Call this after a successful save to avoid CanDeactivate prompt
  protected finalizeSaveSuccess(): void {
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
