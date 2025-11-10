import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { FormBaseComponent } from '../../../core/components/form-base/form-base.component';
import { Breed } from '../../../core/models/breed.model';
import { Client } from '../../../core/models/client.model';
import { Dog } from '../../../core/models/dog.model';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { BreedService } from '../../../core/services/breed.service';
import { ClientService } from '../../../core/services/client.service';
import { MobileService } from '../../../core/services/mobile.service';
import { ToastrService } from '../../../core/services/toastr.service';

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
  private readonly toastrService = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly mobileService = inject(MobileService);

  get isMobile() {
    return this.mobileService.isMobile;
  }

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
    throw new Error('Method not implemented.');
  }

  override initForm(): Promise<void> {
    return new Promise((resolve) => {
      this.form = this.fb.group({
        id: new FormControl(null),
        name: new FormControl(null, Validators.required),
        email: new FormControl(null, [Validators.required, Validators.email]),
        phone: new FormControl(null, Validators.required),
        dogs: this.fb.array<
          FormGroup<{
            name: FormControl<string | null>;
            breed: FormControl<Breed | null>;
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
      const clientId = this.route.snapshot.paramMap.get('id');
      this.form.controls.id.patchValue(clientId);
      this.loadClientData(clientId);
      return;
    }

    this.breadcrumbService.setItems([
      { label: 'Klanten', routerLink: '/clients' },
      { label: 'Nieuwe Klant' },
    ]);
  }

  searchBreeds(event: AutoCompleteCompleteEvent) {
    const query = event.query;
    this.filteredBreeds = this.allBreeds.filter((breed) =>
      breed.name.toLowerCase().includes(query.toLowerCase()),
    );
  }

  loadBreeds(): void {
    this.breedService.getData$().subscribe((data) => {
      this.allBreeds = data;
      this.filteredBreeds = this.allBreeds;
    });
  }

  loadClientData(id: string): void {
    this.clientService.getById(id).subscribe((client) => {
      if (client == null) {
        this.router.navigate(['/not-found']);
      }

      this.form.patchValue(client);
      this.dogsArray.clear();
      client.dogs.forEach((dog) => this.dogsArray.push(this.newDogGroup(dog)));
      this.breadcrumbService.setItems([
        { label: 'Klanten', routerLink: '/clients' },
        { label: client.name },
      ]);
    });
  }

  get dogsArray() {
    return this.form.controls.dogs;
  }

  newDogGroup(dog?: Dog): FormGroup {
    return this.fb.group({
      name: [dog?.name || '', Validators.required],
      breed: [dog?.breed, Validators.required],
      age: [dog?.age || null],
      gender: [dog?.gender || null],
      isNeutered: [dog?.isNeutered || false],
      isAggressive: [dog?.isAggressive || false],
    });
  }

  addDog(): void {
    this.dogsArray.push(this.newDogGroup());
  }

  removeDog(index: number): void {
    this.dogsArray.removeAt(index);
  }

  saveClient(): void {
    if (this.form.invalid) {
      return;
    }

    const clientData: Client = {
      id: this.form.value.id,
      name: this.form.value.name,
      email: this.form.value.email,
      phone: this.form.value.phone,
      dogs: this.form.value.dogs.map((dog) => ({
        name: dog.name,
        breed: dog.breed,
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
        this.toastrService.success(
          'Succes',
          `Klant ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
        );
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        this.toastrService.error('Fout', err.message);
      },
    });
  }

  override cancel() {
    return super.cancel().then((confirmed) => {
      if (confirmed) {
        this.router.navigate(['/clients']);
      }
      return confirmed;
    });
  }
}
