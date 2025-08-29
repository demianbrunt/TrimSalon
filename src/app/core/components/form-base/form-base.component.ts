import { Directive, HostListener, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';

import { FormMode } from '../../enums/form-mode.enum';
import { ConfirmationDialogService } from '../../services/confirmation-dialog.service';
import { ToastrService } from '../../services/toastr.service';
import { BaseComponent } from '../base/base.component';
import { CanDeactivateComponent } from '../can-deactivate/can-deactivate.component';

@Directive()
export abstract class FormBaseComponent
  extends BaseComponent
  implements CanDeactivateComponent
{
  routeIdParam: unknown;
  isSaving = false;
  isCanceling = false;

  private formMode: FormMode;

  protected readonly formBuilder: FormBuilder = inject(FormBuilder);
  protected readonly toastr: ToastrService = inject(ToastrService);
  protected readonly confirmationDialogService = inject(
    ConfirmationDialogService,
  );

  abstract form: FormGroup | FormArray;

  get isCreateMode() {
    return this.formMode === FormMode.Create;
  }

  get isEditMode() {
    return this.formMode === FormMode.Edit;
  }

  constructor() {
    super();

    if (this.activatedRoute.snapshot.paramMap.has('id')) {
      this.routeIdParam = this.activatedRoute.snapshot.paramMap.get('id');
    }

    this.formMode = this.getFormMode() ?? FormMode.Create;
  }

  submit() {
    if (!this.isInitialized || this.isLoading) return;

    if (this.isSaving) {
      this.isSaving = true;
    }

    if (!this.ensureValidity()) {
      this.toastr.error('Oeps!', 'Heb je alles correct ingevoerd?');
      return;
    }

    this.afterValidityEnsured()?.then(
      () => (this.isSaving = false),
      () => (this.isSaving = false),
    );
  }

  canDeactivate(): Promise<boolean> {
    if ((this?.form?.dirty || this?.form?.touched) && !this.isCanceling) {
      return this.confirmationDialogService.open(
        'Openstaande wijzigingen',
        '<b>Let op!</b> Vergeten op te slaan? Als je doorgaat zullen de niet opgeslagen wijzigingen verloren gaan.',
      );
    }
    return new Promise((resolve) => resolve(true));
  }

  @HostListener('window:beforeunload', ['$event'])
  protected unloadNotification($event: BeforeUnloadEvent) {
    if (!this.canDeactivate()) {
      $event.returnValue = true;
    }
  }

  cancel() {
    this.isCanceling = true;
    if (this.form.pristine) {
      this.isCanceling = false;
      return Promise.resolve(true);
    }

    return this.confirmationDialogService
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
}
