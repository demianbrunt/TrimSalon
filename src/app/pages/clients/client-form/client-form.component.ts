import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { ValidationMessageComponent } from '../../../core/components/validation-message/validation-message.component';
import { Breed } from '../../../core/models/breed.model';
import { Client } from '../../../core/models/client.model';
import { Dog } from '../../../core/models/dog.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { BreedService } from '../../../core/services/breed.service';
import { ClientService } from '../../../core/services/client.service';
@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    SelectModule,
    FloatLabelModule,
    DividerModule,
    ToastModule,
    AutoCompleteModule,
    CardModule,
    MessageModule,
    ValidationMessageComponent,
    DatePickerModule,
    TagModule,
  ],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css'],
})
export class ClientFormComponent extends FormBaseComponent implements OnInit {
  override form: FormGroup<{
    id: FormControl<string | null>;
    name: FormControl<string | null>;
    email: FormControl<string | null>;
    phone: FormControl<string | null>;
    dogs: FormArray<
      FormGroup<{
        name: FormControl<string | null>;
        breed: FormControl<Breed | null>;
        dateOfBirth: FormControl<Date | null>;
        age: FormControl<number | null>;
        gender: FormControl<'male' | 'female' | null>;
        isNeutered: FormControl<boolean | null>;
        isAggressive: FormControl<boolean | null>;
      }>
    >;
  }>;

  allBreeds: Breed[] = [];
  filteredBreeds: Breed[] = [];

  private readonly clientService = inject(ClientService);
  private readonly breedService = inject(BreedService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly destroyRef = inject(DestroyRef);

  get canDeleteDog() {
    return this.dogsArray.length > 1;
  }

  get name() {
    return this.form.controls.name;
  }

  get email() {
    return this.form.controls.email;
  }

  get phone() {
    return this.form.controls.phone;
  }

  constructor() {
    super();
  }

  override afterValidityEnsured(): Promise<void> {
    return new Promise((resolve, reject) => {
      const formValue = this.form.getRawValue();
      const clientData: Client = {
        id: formValue.id,
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        dogs: formValue.dogs.map((dog) => ({
          name: dog.name,
          breed: dog.breed,
          dateOfBirth: dog.dateOfBirth,
          age: dog.age,
          gender: dog.gender,
          isNeutered: dog.isNeutered,
          isAggressive: dog.isAggressive,
        })),
      };

      const operation = this.isEditMode
        ? this.clientService.update(clientData)
        : this.clientService.add(clientData);

      operation.subscribe({
        next: () => {
          this.finalizeSaveSuccess();
          this.toastr.success(
            'Succes',
            `Klant ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
          );
          this.router.navigate(['/clients'], {
            queryParamsHandling: 'preserve',
          });
          resolve();
        },
        error: (err) => {
          this.toastr.error('Fout', err.message);
          reject(err);
        },
      });
    });
  }

  override initForm(): Promise<void> {
    return new Promise((resolve) => {
      this.form = this.formBuilder.group({
        id: new FormControl(null),
        name: new FormControl(null, Validators.required),
        email: new FormControl(null, [Validators.email]),
        phone: new FormControl(null, Validators.required),
        dogs: this.formBuilder.array<
          FormGroup<{
            name: FormControl<string | null>;
            breed: FormControl<Breed | null>;
            dateOfBirth: FormControl<Date | null>;
            age: FormControl<number | null>;
            gender: FormControl<'male' | 'female' | null>;
            isNeutered: FormControl<boolean | null>;
            isAggressive: FormControl<boolean | null>;
          }>
        >([]),
      });

      if (this.isCreateMode) {
        this.addDog();
      }
      resolve();
    });
  }

  ngOnInit(): void {
    this.loadBreeds();
    this.initForm();

    if (this.isEditMode) {
      const clientId = this.activatedRoute.snapshot.paramMap.get('id');
      this.form.controls.id.patchValue(clientId);
      this.loadClientData(clientId);
      return;
    }

    // Create mode - form is ready
    this.isInitialized = true;
    this.isLoading = false;

    this.breadcrumbService.setItems([
      { label: 'Klanten', routerLink: '/clients' },
      { label: 'Nieuwe Klant' },
    ]);
  }

  searchBreeds(event: AutoCompleteCompleteEvent) {
    const query = event.query;
    this.filteredBreeds = this.allBreeds
      .filter((breed) => breed.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  loadBreeds(): void {
    this.breedService
      .getData$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.allBreeds = data.sort((a, b) => a.name.localeCompare(b.name));
        this.filteredBreeds = this.allBreeds;
      });
  }

  loadClientData(id: string): void {
    this.clientService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((client) => {
        if (client == null) {
          this.router.navigate(['/not-found']);
          return;
        }

        this.form.patchValue({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
        });
        this.dogsArray.clear();
        client.dogs.forEach((dog) =>
          this.dogsArray.push(this.newDogGroup(dog)),
        );
        this.breadcrumbService.setItems([
          { label: 'Klanten', routerLink: '/clients' },
          { label: client.name },
        ]);

        // Edit mode - form is ready after data loaded
        this.isInitialized = true;
        this.isLoading = false;
      });
  }

  get dogsArray() {
    return this.form.controls.dogs;
  }

  newDogGroup(dog?: Dog): FormGroup {
    const dob = dog?.dateOfBirth ? new Date(dog.dateOfBirth) : null;
    const group = this.formBuilder.group({
      name: [dog?.name || '', Validators.required],
      breed: [dog?.breed, Validators.required],
      dateOfBirth: [dob],
      age: [{ value: dog?.age || null, disabled: true }],
      gender: [dog?.gender || null],
      isNeutered: [dog?.isNeutered || false],
      isAggressive: [dog?.isAggressive || false],
    });

    group.controls.dateOfBirth.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date: Date | null) => {
        if (date) {
          const age = this.calculateAge(date);
          group.controls.age.setValue(age);
        } else {
          group.controls.age.setValue(null);
        }
      });

    return group;
  }

  calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  addDog(): void {
    this.dogsArray.push(this.newDogGroup());
  }

  removeDog(index: number): void {
    this.dogsArray.removeAt(index);
  }

  override cancel() {
    return super.cancel().then((confirmed) => {
      if (confirmed) {
        this.router.navigate(['/clients'], {
          queryParamsHandling: 'preserve',
        });
      }
      return confirmed;
    });
  }
}
