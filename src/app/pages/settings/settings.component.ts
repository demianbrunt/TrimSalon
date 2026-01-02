import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { forkJoin, map } from 'rxjs';
import { TOAST_TITLE } from '../../core/constants/toast-titles';
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
} from '../../core/models/app-settings.model';
import { Breed, DogBreedSize } from '../../core/models/breed.model';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { BreedService } from '../../core/services/breed.service';
import { ToastrService } from '../../core/services/toastr.service';

type SettingsTab = 'general' | 'breeds';
const DEFAULT_SETTINGS_TAB: SettingsTab = 'general';

interface SettingsFormControls {
  korEnabled: FormControl<boolean>;
  defaultVatRate: FormControl<number>;
  targetHourlyRate: FormControl<number>;
  weeklyAvailableHoursTarget: FormControl<number>;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    CheckboxModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TabsModule,
    TableModule,
    ButtonModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  form!: FormGroup<SettingsFormControls>;
  isSaving = false;

  readonly activeTab = signal<SettingsTab>(DEFAULT_SETTINGS_TAB);

  private lastLoadedSettings: AppSettings = DEFAULT_APP_SETTINGS;

  breeds: Breed[] = [];
  breedFilter = '';
  isBreedsLoading = false;
  isBreedsSaving = false;

  private readonly breedDrafts = new Map<
    string,
    { size?: DogBreedSize; accepted?: boolean }
  >();

  readonly breedSizeOptions: { label: string; value: DogBreedSize }[] = [
    { label: 'Klein', value: 'small' },
    { label: 'Middel', value: 'medium' },
    { label: 'Groot', value: 'large' },
  ];

  readonly addBreedForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    size: new FormControl<DogBreedSize>('medium', {
      nonNullable: true,
    }),
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly settingsService = inject(AppSettingsService);
  private readonly breedService = inject(BreedService);
  private readonly toastr = inject(ToastrService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isCompactLayout = toSignal(
    this.breakpointObserver
      .observe(['(max-width: 900px)'])
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  ngOnInit(): void {
    this.breadcrumbService.setItems([{ label: 'Instellingen' }]);

    this.activeTab.set(
      this.sanitizeTab(
        this.route.snapshot.queryParamMap.get('tab') ?? DEFAULT_SETTINGS_TAB,
      ),
    );

    // Keep UI in sync when the user navigates browser history.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParamMap) => {
        const tab = this.sanitizeTab(
          queryParamMap.get('tab') ?? DEFAULT_SETTINGS_TAB,
        );
        if (tab !== this.activeTab()) {
          this.activeTab.set(tab);
        }
      });

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
      weeklyAvailableHoursTarget: new FormControl(
        DEFAULT_APP_SETTINGS.weeklyAvailableHoursTarget,
        {
          nonNullable: true,
          validators: [Validators.required, Validators.min(0)],
        },
      ),
    });

    this.settingsService.settings$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((settings) => {
        this.lastLoadedSettings = settings;
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

    this.loadBreeds();
  }

  onTabChange(tab: string | number): void {
    const nextTab = this.sanitizeTab(String(tab));
    if (nextTab === this.activeTab()) {
      return;
    }

    this.activeTab.set(nextTab);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tab: nextTab === DEFAULT_SETTINGS_TAB ? null : nextTab,
      },
      queryParamsHandling: 'merge',
    });
  }

  private sanitizeTab(tab: string): SettingsTab {
    return tab === 'breeds' ? 'breeds' : 'general';
  }

  get filteredBreeds(): Breed[] {
    const q = this.breedFilter.trim().toLowerCase();

    const filtered = q
      ? this.breeds.filter((b) => b.name.toLowerCase().includes(q))
      : this.breeds;

    return [...filtered].sort((a, b) => {
      const aActive = !a.deletedAt;
      const bActive = !b.deletedAt;
      if (aActive !== bActive) return aActive ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  get hasBreedChanges(): boolean {
    return this.breedDrafts.size > 0;
  }

  draftBreedSize(breed: Breed): DogBreedSize {
    return (
      this.breedDrafts.get(this.getBreedDraftKey(breed))?.size ?? breed.size
    );
  }

  isBreedAccepted(breed: Breed): boolean {
    const draftAccepted = this.breedDrafts.get(
      this.getBreedDraftKey(breed),
    )?.accepted;
    if (draftAccepted !== undefined) {
      return draftAccepted;
    }

    return !breed.deletedAt;
  }

  setDraftBreedSize(breed: Breed, size: DogBreedSize): void {
    const key = this.getBreedDraftKey(breed);
    const draft = this.breedDrafts.get(key) ?? {};

    if (breed.size === size) {
      delete draft.size;
    } else {
      draft.size = size;
    }

    this.updateBreedDraft(key, draft);
  }

  toggleDraftBreedAccepted(breed: Breed): void {
    const key = this.getBreedDraftKey(breed);
    const draft = this.breedDrafts.get(key) ?? {};

    const current = this.isBreedAccepted(breed);
    const next = !current;
    const original = !breed.deletedAt;

    if (next === original) {
      delete draft.accepted;
    } else {
      draft.accepted = next;
    }

    this.updateBreedDraft(key, draft);
  }

  cancelBreedChanges(): void {
    this.breedDrafts.clear();
  }

  saveBreedChanges(): void {
    if (this.isBreedsSaving || !this.hasBreedChanges) {
      return;
    }

    const ops = this.breeds
      .filter((b) => !!b.id)
      .flatMap((breed) => {
        const draft = this.breedDrafts.get(this.getBreedDraftKey(breed));
        if (!draft || !breed.id) {
          return [];
        }

        const itemOps = [];

        if (draft.size && draft.size !== breed.size) {
          itemOps.push(
            this.breedService.update({ ...breed, size: draft.size }),
          );
        }

        if (draft.accepted !== undefined) {
          itemOps.push(
            draft.accepted
              ? this.breedService.restore(breed.id)
              : this.breedService.archive(breed.id),
          );
        }

        return itemOps;
      });

    if (ops.length === 0) {
      this.breedDrafts.clear();
      return;
    }

    this.isBreedsSaving = true;
    forkJoin(ops).subscribe({
      next: () => {
        this.breedDrafts.clear();
        this.toastr.success(TOAST_TITLE.success, 'Rassen opgeslagen');
        this.isBreedsSaving = false;
      },
      error: (err) => {
        this.toastr.error(TOAST_TITLE.error, (err as Error).message);
        this.isBreedsSaving = false;
      },
    });
  }

  private loadBreeds(): void {
    this.isBreedsLoading = true;
    this.breedService
      .getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (breeds) => {
          this.breeds = breeds;
          this.isBreedsLoading = false;
        },
        error: (err) => {
          this.isBreedsLoading = false;
          this.toastr.error(TOAST_TITLE.error, (err as Error).message);
        },
      });
  }

  addBreed(): void {
    if (this.addBreedForm.invalid) {
      this.addBreedForm.markAllAsTouched();
      return;
    }

    const name = this.addBreedForm.controls.name.value.trim();
    if (!name) {
      return;
    }

    const exists = this.breeds.some(
      (b) => b.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      this.toastr.error(TOAST_TITLE.error, 'Dit ras bestaat al.');
      return;
    }

    const size = this.addBreedForm.controls.size.value;

    this.breedService.add({ name, size }).subscribe({
      next: () => {
        this.toastr.success(TOAST_TITLE.success, 'Ras toegevoegd');
        this.addBreedForm.controls.name.setValue('');
      },
      error: (err) => {
        this.toastr.error(TOAST_TITLE.error, (err as Error).message);
      },
    });
  }

  setBreedAccepted(breed: Breed, accepted: boolean): void {
    if (!breed.id) return;

    const op = accepted
      ? this.breedService.restore(breed.id)
      : this.breedService.archive(breed.id);

    op.subscribe({
      next: () => {
        this.toastr.success(
          TOAST_TITLE.success,
          accepted ? 'Ras geactiveerd' : 'Ras uitgezet',
        );
      },
      error: (err) => {
        this.toastr.error(TOAST_TITLE.error, (err as Error).message);
      },
    });
  }

  updateBreedSize(breed: Breed, size: DogBreedSize): void {
    if (!breed.id) return;
    if (breed.size === size) return;

    this.breedService.update({ ...breed, size }).subscribe({
      next: () => {
        this.toastr.success(TOAST_TITLE.success, 'Grootte bijgewerkt');
      },
      error: (err) => {
        this.toastr.error(TOAST_TITLE.error, (err as Error).message);
      },
    });
  }

  private getBreedDraftKey(breed: Breed): string {
    return breed.id ?? breed.name;
  }

  private updateBreedDraft(
    key: string,
    draft: { size?: DogBreedSize; accepted?: boolean },
  ): void {
    if (draft.size === undefined && draft.accepted === undefined) {
      this.breedDrafts.delete(key);
      return;
    }

    this.breedDrafts.set(key, draft);
  }

  trackByBreedId(_: number, breed: Breed): string {
    return breed.id ?? breed.name;
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
        weeklyAvailableHoursTarget: value.weeklyAvailableHoursTarget,
      };

      await this.settingsService.saveSettings(nextSettings);
      this.toastr.success(TOAST_TITLE.success, 'Instellingen opgeslagen');
    } catch (err) {
      this.toastr.error(TOAST_TITLE.error, (err as Error).message);
    } finally {
      this.isSaving = false;
    }
  }

  cancel(): void {
    // Reset back to the latest stored settings snapshot.
    this.form.reset(this.lastLoadedSettings);
  }
}
