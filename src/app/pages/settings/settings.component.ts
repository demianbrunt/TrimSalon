import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { TOAST_TITLE } from '../../core/constants/toast-titles';
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
} from '../../core/models/app-settings.model';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ToastrService } from '../../core/services/toastr.service';

interface SettingsFormControls {
  korEnabled: FormControl<boolean>;
  defaultVatRate: FormControl<number>;
  targetHourlyRate: FormControl<number>;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    CheckboxModule,
    InputNumberModule,
    ButtonModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  form!: FormGroup<SettingsFormControls>;
  isSaving = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly settingsService = inject(AppSettingsService);
  private readonly toastr = inject(ToastrService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  ngOnInit(): void {
    this.breadcrumbService.setItems([{ label: 'Instellingen' }]);

    this.form = new FormGroup<SettingsFormControls>({
      korEnabled: new FormControl(DEFAULT_APP_SETTINGS.korEnabled, {
        nonNullable: true,
      }),
      defaultVatRate: new FormControl(DEFAULT_APP_SETTINGS.defaultVatRate, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(0),
          Validators.max(100),
        ],
      }),
      targetHourlyRate: new FormControl(DEFAULT_APP_SETTINGS.targetHourlyRate, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
    });

    this.settingsService.settings$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((settings) => {
        this.form.patchValue(settings, { emitEvent: false });
      });

    this.form.controls.korEnabled.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((korEnabled) => {
        if (korEnabled) {
          this.form.controls.defaultVatRate.setValue(0);
          this.form.controls.defaultVatRate.disable({ emitEvent: false });
        } else {
          this.form.controls.defaultVatRate.enable({ emitEvent: false });
          if (this.form.controls.defaultVatRate.value === 0) {
            this.form.controls.defaultVatRate.setValue(
              DEFAULT_APP_SETTINGS.defaultVatRate,
            );
          }
        }
      });
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    try {
      const value = this.form.getRawValue();
      const nextSettings: AppSettings = {
        korEnabled: value.korEnabled,
        defaultVatRate: value.defaultVatRate,
        targetHourlyRate: value.targetHourlyRate,
      };

      await this.settingsService.saveSettings(nextSettings);
      this.toastr.success(TOAST_TITLE.success, 'Instellingen opgeslagen');
    } catch (err) {
      this.toastr.error(TOAST_TITLE.error, (err as Error).message);
    } finally {
      this.isSaving = false;
    }
  }
}
