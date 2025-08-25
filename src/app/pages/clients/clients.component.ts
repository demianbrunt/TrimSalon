import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DataViewModule } from 'primeng/dataview';
import { Dialog, DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TableHeaderComponent } from '../../core/components/table-header/table-header.component';
import { Breed } from '../../core/models/breed.model';
import { Client } from '../../core/models/client.model';
import { Dog } from '../../core/models/dog.model';
import { BreedService } from '../../core/services/breed.service';
import { ClientService } from '../../core/services/client.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    TagModule,
    TooltipModule,
    DialogModule,
    ToastModule,
    SelectModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    TableHeaderComponent,
    DataViewModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './clients.component.html',
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  selectedClient: Client | null = null;
  displayForm = false;
  clientForm: FormGroup;
  allBreeds: Breed[] = [];
  sortField = 'name';
  sortOrder = 1;

  isMobile = false;
  isIntialized = false;

  @ViewChild('dialogEl') dialog: Dialog | undefined;

  private readonly clientService = inject(ClientService);
  private readonly breedService = inject(BreedService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);
  private readonly breakpointObserver = inject(BreakpointObserver);

  constructor() {
    this.breakpointObserver.observe(Breakpoints.XSmall).subscribe((result) => {
      this.isMobile = result.matches;
    });

    this.clientForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      dogs: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadBreeds();
  }

  get dogsArray(): FormArray {
    return this.clientForm.get('dogs') as FormArray;
  }

  loadClients(): void {
    this.clientService.getData$().subscribe({
      next: (data) => {
        this.clients = data;
        this.isIntialized = true;
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

  loadBreeds(): void {
    this.breedService.getData$().subscribe((data) => (this.allBreeds = data));
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

  showClientForm(client?: Client): void {
    this.selectedClient = client || null;
    this.clientForm.reset();
    this.dogsArray.clear();

    if (client) {
      this.clientForm.patchValue({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
      });
      client.dogs.forEach((dog) => this.dogsArray.push(this.newDogGroup(dog)));
    } else {
      this.addDog(); // Start with one dog form for a new client
    }
    this.displayForm = true;

    if (this.isMobile) {
      this.dialog?.maximize();
    }
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      return;
    }

    const clientData: Client = this.clientForm.value;

    const operation = clientData.id
      ? this.clientService.update(clientData)
      : this.clientService.add(clientData);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succes',
          detail: `Klant ${clientData.id ? 'bijgewerkt' : 'aangemaakt'}`,
        });
        this.loadClients();
        this.displayForm = false;
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

  deleteClient(client: Client): void {
    this.confirmationService.confirm({
      message: `Weet je zeker dat je ${client.name} wilt anonimiseren? Dit kan niet ongedaan worden gemaakt.`,
      header: 'Bevestiging Anonimiseren',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.clientService.delete(client.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succes',
              detail: 'Klant geanonimiseerd',
            });
            this.loadClients();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Fout',
              detail: err.message,
            });
          },
        });
      },
    });
  }
}
