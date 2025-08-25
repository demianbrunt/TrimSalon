import { Component, inject, OnInit, HostBinding } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ClientService } from '../../../core/services/client.service';
import { BreedService } from '../../../core/services/breed.service';
import { Client } from '../../../core/models/client.model';
import { Breed } from '../../../core/models/breed.model';
import { Dog } from '../../../core/models/dog.model';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    FloatLabelModule,
    DividerModule,
    MessageModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css'],
})
export class ClientFormComponent implements OnInit {
  @HostBinding('class.is-mobile') isMobile = false;

  clientForm: FormGroup;
  allBreeds: Breed[] = [];
  isEditMode = false;
  clientId: string | null = null;

  private readonly clientService = inject(ClientService);
  private readonly breedService = inject(BreedService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly breadcrumbService = inject(BreadcrumbService);

  constructor() {
    this.breakpointObserver.observe(Breakpoints.XSmall).subscribe((result) => {
      this.isMobile = result.matches;
    });

    this.clientForm = this.fb.group({
      id: new FormControl(null),
      name: new FormControl(null, Validators.required),
      email: new FormControl(null, [Validators.required, Validators.email]),
      phone: new FormControl(null, Validators.required),
      dogs: this.fb.array<
        FormGroup<{
          name: FormControl<string | null>;
          breed: FormControl<Breed | null>;
        }>
      >([]),
    });
  }

  ngOnInit(): void {
    this.loadBreeds();
    this.clientId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.clientId;

    if (this.isEditMode) {
      this.loadClientData(this.clientId!);
    } else {
      this.addDog();
      this.breadcrumbService.setItems([
        { label: 'Klanten', routerLink: '/clients' },
        { label: 'Nieuwe Klant' },
      ]);
    }
  }

  get name() {
    return this.clientForm.get('name') as FormControl;
  }

  get email() {
    return this.clientForm.get('email') as FormControl;
  }

  get phone() {
    return this.clientForm.get('phone') as FormControl;
  }

  loadBreeds(): void {
    this.breedService.getData$().subscribe((data) => (this.allBreeds = data));
  }

  loadClientData(id: string): void {
    this.clientService.getById(id).subscribe((client) => {
      if (client) {
        this.clientForm.patchValue(client);
        client.dogs.forEach((dog) =>
          this.dogsArray.push(this.newDogGroup(dog)),
        );
        this.breadcrumbService.setItems([
          { label: 'Klanten', routerLink: '/clients' },
          { label: client.name },
        ]);
      }
    });
  }

  get dogsArray(): FormArray {
    return this.clientForm.get('dogs') as FormArray;
  }

  newDogGroup(dog?: Dog): FormGroup {
    return this.fb.group({
      name: [dog?.name || '', Validators.required],
      breed: [dog?.breed, Validators.required],
    });
  }

  addDog(): void {
    this.dogsArray.push(this.newDogGroup());
  }

  removeDog(index: number): void {
    this.dogsArray.removeAt(index);
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      return;
    }

    const clientData: Client = this.clientForm.value;

    const operation = this.isEditMode
      ? this.clientService.update(clientData)
      : this.clientService.add(clientData);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succes',
          detail: `Klant ${this.isEditMode ? 'bijgewerkt' : 'aangemaakt'}`,
        });
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Fout',
          detail: err.message,
        });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/clients']);
  }
}
