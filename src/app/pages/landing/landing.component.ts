import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { StepsModule } from 'primeng/steps';
import { TagModule } from 'primeng/tag';

import { Breed } from '../../core/models/breed.model';
import { Package } from '../../core/models/package.model';
import { Service } from '../../core/models/service.model';
import { BookingRequestService } from '../../core/services/booking-request.service';
import { BreedService } from '../../core/services/breed.service';
import { PackageService } from '../../core/services/package.service';
import { PricingService } from '../../core/services/pricing.service';
import { ServiceService } from '../../core/services/service.service';

type CatalogId = string;

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

@Component({
  standalone: true,
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    Button,
    CardModule,
    DividerModule,
    TagModule,
    CheckboxModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    StepsModule,
    MessageModule,
    DialogModule,
  ],
  styleUrls: ['./landing.component.css'],
  template: `
    <a class="sr-only skip-link" href="#maincontent">Skip naar hoofdinhoud</a>

    <p-dialog
      header="Demo omgeving"
      [modal]="true"
      [dismissableMask]="true"
      [draggable]="false"
      [resizable]="false"
      [visible]="demoDialogVisible()"
      (visibleChange)="onDemoDialogVisibleChange($event)"
    >
      <p class="m-0">
        Dit is een demo-omgeving. Dit is geen echt bedrijf en de informatie op
        deze pagina is fictief.
      </p>
      <p class="mt-3 mb-0 text-600">
        Gebruik geen echte persoonsgegevens. Gegevens kunnen op elk moment
        worden verwijderd.
      </p>

      <ng-template pTemplate="footer">
        <p-button label="Ik begrijp het" (onClick)="acknowledgeDemoNotice()" />
      </ng-template>
    </p-dialog>

    <header class="landing-header hidden md:block">
      <div
        class="landing-container flex align-items-center justify-content-between gap-3"
      >
        <div class="flex gap-2 align-items-center">
          <p-button
            label="Afspraak maken"
            icon="pi pi-calendar"
            (onClick)="scrollToId('boeken')"
          />
          <a class="landing-admin-link" [routerLink]="['/admin/signin']"
            >Beheer</a
          >
        </div>
      </div>
    </header>

    <main id="maincontent" class="landing-main" tabindex="-1">
      <section class="landing-hero" aria-labelledby="hero-title">
        <div class="landing-container grid">
          <div class="col-12 lg:col-6">
            <p-tag
              severity="success"
              [value]="'Professionele trimsalon (demo)'"
            />

            <h1 id="hero-title" class="landing-hero-title">
              Jouw hond,<br />
              <span class="text-primary">mijn passie</span>
            </h1>

            <p class="text-lg text-700 line-height-3 max-w-30rem">
              Welkom bij Marlie’s TrimSalon. Liefdevolle verzorging met extra
              aandacht voor honden die wat meer rust en geduld nodig hebben.
            </p>

            <div class="flex flex-column sm:flex-row gap-2 mt-4">
              <p-button
                label="Maak een afspraak"
                icon="pi pi-arrow-right"
                iconPos="right"
                (onClick)="scrollToId('boeken')"
              />
              <p-button
                label="Bekijk diensten"
                severity="secondary"
                [outlined]="true"
                (onClick)="scrollToId('diensten')"
              />
            </div>

            <div class="mt-4 text-sm text-600">
              Uitsluitend op afspraak • WhatsApp is het snelst
            </div>
          </div>

          <div class="col-12 lg:col-6">
            <div class="landing-hero-card">
              <div class="landing-hero-card-inner">
                <div class="text-center">
                  <i class="pi pi-image text-primary" aria-hidden="true"></i>
                  <div class="text-lg font-semibold mt-2">Foto placeholder</div>
                  <div class="text-sm text-600 mt-1">
                    Voeg later een professionele foto toe (Marlie / trimsalon).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="diensten"
        class="landing-section"
        aria-labelledby="diensten-title"
      >
        <div class="landing-container">
          <div class="text-center mb-4">
            <h2 id="diensten-title" class="landing-section-title">
              Mijn diensten
            </h2>
            <p class="text-600 text-lg m-0">
              Professionele verzorging met persoonlijke aandacht
            </p>
          </div>

          @if (catalogServices().length === 0) {
            <p-card styleClass="landing-card">
              <div role="status" aria-live="polite">
                <p-message
                  severity="warn"
                  [closable]="false"
                  text="Momenteel niet beschikbaar. Er staan nu geen diensten online. Probeer het later opnieuw of neem contact op via WhatsApp."
                />
              </div>
            </p-card>
          } @else {
            <div class="grid">
              @for (
                service of catalogServices();
                track service.id ?? service.name
              ) {
                <div class="col-12 sm:col-6 lg:col-3">
                  <p-card styleClass="h-full landing-card">
                    <ng-template #header>
                      <div class="landing-card-header">
                        <div>
                          <div class="text-base font-semibold">
                            {{ service.name }}
                          </div>
                          @if (serviceFromPrice(service) > 0) {
                            <div class="text-primary font-semibold text-sm">
                              Vanaf €{{ serviceFromPrice(service) }}
                            </div>
                          }
                        </div>
                      </div>
                    </ng-template>

                    <p class="text-sm text-600 line-height-3 m-0">
                      {{ service.description }}
                    </p>
                  </p-card>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <section
        class="landing-section landing-alt"
        aria-labelledby="werkwijze-title"
      >
        <div class="landing-container grid align-items-center">
          <div class="col-12 lg:col-6">
            <p-tag severity="warn" value="Mijn werkwijze" />
            <h2 id="werkwijze-title" class="landing-section-title mt-3">
              Extra aandacht en liefde voor elke hond
            </h2>
            <p class="text-700 line-height-3">
              Rust, geduld en een vertrouwde omgeving. Geen hectiek, geen
              tijdsdruk.
            </p>

            <div class="mt-4 grid">
              @for (item of specialties; track item.title) {
                <div class="col-12">
                  <div class="flex gap-3">
                    <div class="landing-icon" aria-hidden="true">
                      <i class="pi" [class]="item.icon"></i>
                    </div>
                    <div>
                      <div class="font-semibold">{{ item.title }}</div>
                      <div class="text-600">{{ item.description }}</div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="col-12 lg:col-6">
            <p-card styleClass="landing-photo-card landing-photo-card--image">
              <ng-template #header>
                <div class="landing-photo-wrap">
                  <img
                    src="landingpage-foto-2.webp"
                    sizes="(min-width: 992px) 520px, 100vw"
                    alt="Marlie met een ontspannen hond tijdens een rustige trimbehandeling"
                    class="landing-photo"
                  />
                </div>
              </ng-template>
              <span class="sr-only"> Voorbeeldfoto bij ‘Mijn werkwijze’. </span>
            </p-card>
          </div>
        </div>
      </section>

      <section id="over" class="landing-section" aria-labelledby="over-title">
        <div class="landing-container grid align-items-center">
          <div class="col-12 lg:col-5">
            <p-card styleClass="landing-photo-card">
              <div class="text-center">
                <i class="pi pi-user text-primary" aria-hidden="true"></i>
                <div class="text-lg font-semibold mt-2">Foto placeholder</div>
                <div class="text-sm text-600 mt-1">
                  Warme portretfoto van Marlie.
                </div>
              </div>
            </p-card>
          </div>

          <div class="col-12 lg:col-7">
            <h2 id="over-title" class="landing-section-title">Over Marlie</h2>
            <p class="text-700 line-height-3">
              Welkom bij Marlie TrimSalon! Vanuit mijn thuissalon bied ik
              persoonlijke en professionele verzorging voor jouw viervoeter.
            </p>
            <p class="text-700 line-height-3">
              Het belangrijkste is dat jouw hond zich prettig en veilig voelt
              tijdens het trimproces.
            </p>

            <div class="mt-3">
              <p-button
                label="Kennismaken? Neem contact op"
                icon="pi pi-envelope"
                (onClick)="scrollToId('contact')"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="reviews"
        class="landing-section landing-muted"
        aria-labelledby="reviews-title"
      >
        <div class="landing-container">
          <div class="text-center mb-4">
            <h2 id="reviews-title" class="landing-section-title">
              Wat klanten zeggen
            </h2>
            <p class="text-600 text-lg m-0">Ervaringen van tevreden klanten</p>
          </div>

          <div class="grid">
            @for (review of reviews; track review.id) {
              <div class="col-12 md:col-6 lg:col-4">
                <p-card styleClass="h-full landing-card">
                  <div class="flex align-items-start gap-3">
                    <div class="landing-avatar" aria-hidden="true">
                      <i class="pi pi-user"></i>
                    </div>
                    <div class="flex-1">
                      <div class="font-semibold">{{ review.name }}</div>
                      <div
                        class="landing-stars"
                        aria-label="{{ review.rating }} van 5 sterren"
                      >
                        @for (star of stars; track $index) {
                          <i
                            class="pi"
                            [class.pi-star-fill]="$index < review.rating"
                            [class.pi-star]="$index >= review.rating"
                            aria-hidden="true"
                          ></i>
                        }
                      </div>
                    </div>
                  </div>

                  <p class="text-600 line-height-3 mt-3 mb-2">
                    “{{ review.comment }}”
                  </p>

                  <div class="text-xs text-500">
                    {{ formatNlDate(review.date) }}
                  </div>
                </p-card>
              </div>
            }
          </div>
        </div>
      </section>

      <section
        id="boeken"
        class="landing-section landing-alt"
        aria-labelledby="boeken-title"
      >
        <div class="landing-container">
          <div class="text-center mb-4">
            <p-tag severity="success" value="Afspraak maken" />
            <h2 id="boeken-title" class="landing-section-title mt-3">
              Plan je afspraak
            </h2>
            <p class="text-600 text-lg m-0">In 3 stappen een aanvraag</p>
          </div>

          @if (!canRequestBooking()) {
            <p-card styleClass="landing-card">
              <div role="status" aria-live="polite">
                <p-message
                  severity="warn"
                  [closable]="false"
                  text="Afspraak aanvragen is tijdelijk niet mogelijk. Er zijn op dit moment geen diensten beschikbaar. Probeer het later opnieuw of stuur een WhatsApp."
                />
              </div>
            </p-card>
          } @else {
            <p-steps
              [model]="bookingSteps()"
              [activeIndex]="currentBookingStep()"
              styleClass="landing-steps"
            />

            <div class="mt-3">
              <p-card styleClass="landing-wizard-card">
                <div class="landing-wizard-shell">
                  <div class="landing-wizard-step">
                    @switch (currentBookingStep()) {
                      @case (0) {
                        <div class="landing-wizard-step-inner">
                          <div class="landing-fieldset">
                            <div class="font-semibold mb-2">
                              Pakket (optioneel)
                            </div>
                            <div class="text-xs text-600 mb-3">
                              Tip: kies “Zelf samenstellen” om losse diensten te
                              selecteren.
                            </div>

                            @if (catalogPackages().length === 0) {
                              <div class="text-sm text-600 mb-2" role="status">
                                Er zijn momenteel geen pakketten beschikbaar. Je
                                kunt wel losse diensten kiezen.
                              </div>
                            }

                            <div class="landing-package-grid">
                              @for (
                                pkg of catalogPackages();
                                track pkg.id ?? pkg.name
                              ) {
                                <button
                                  type="button"
                                  class="landing-option-card"
                                  [class.is-selected]="
                                    selectedPackageId() === pkg.id
                                  "
                                  [attr.aria-pressed]="
                                    selectedPackageId() === pkg.id
                                  "
                                  (click)="
                                    pkg.id ? onPackageSelected(pkg.id) : null
                                  "
                                >
                                  <div class="landing-option-title-row">
                                    <div class="font-semibold">
                                      {{ pkg.name }}
                                    </div>
                                    @if (selectedPackageId() === pkg.id) {
                                      <i
                                        class="pi pi-check"
                                        aria-hidden="true"
                                      ></i>
                                    }
                                  </div>
                                  <div class="text-sm text-600">
                                    {{ packageDescription(pkg) }}
                                  </div>
                                </button>
                              }

                              <button
                                type="button"
                                class="landing-option-card"
                                [class.is-selected]="
                                  selectedPackageId() === 'custom'
                                "
                                [attr.aria-pressed]="
                                  selectedPackageId() === 'custom'
                                "
                                (click)="onPackageSelected('custom')"
                              >
                                <div class="landing-option-title-row">
                                  <div class="font-semibold">
                                    Zelf samenstellen
                                  </div>
                                  @if (selectedPackageId() === 'custom') {
                                    <i
                                      class="pi pi-check"
                                      aria-hidden="true"
                                    ></i>
                                  }
                                </div>
                                <div class="text-sm text-600">
                                  Kies precies de diensten die je wilt.
                                </div>
                              </button>
                            </div>

                            @if (selectedPackageId() !== null) {
                              <div class="mt-2">
                                <button
                                  type="button"
                                  class="landing-link-button"
                                  (click)="onPackageSelected(null)"
                                >
                                  Pakket wissen
                                </button>
                              </div>
                            }
                          </div>

                          <div class="landing-fieldset mt-4">
                            <div class="font-semibold mb-2">
                              Diensten
                              <span class="text-red-600" aria-hidden="true"
                                >*</span
                              >
                            </div>

                            @if (catalogServices().length === 0) {
                              <div role="status" aria-live="polite">
                                <p-message
                                  severity="warn"
                                  [closable]="false"
                                  text="Afspraak aanvragen is tijdelijk niet mogelijk. Er zijn op dit moment geen diensten beschikbaar. Probeer het later opnieuw of stuur een WhatsApp."
                                />
                              </div>
                            } @else {
                              <div
                                class="landing-service-grid"
                                [attr.aria-invalid]="
                                  step0Attempted() &&
                                  selectedServiceIds().length === 0
                                "
                                [attr.aria-describedby]="'step0-services-error'"
                              >
                                @for (
                                  service of catalogServices();
                                  track service.id ?? service.name
                                ) {
                                  <div class="landing-service-row">
                                    <p-checkbox
                                      [inputId]="'svc-' + serviceKey(service)"
                                      [binary]="true"
                                      [ngModel]="
                                        isServiceSelected(serviceKey(service))
                                      "
                                      (onChange)="
                                        toggleService(serviceKey(service))
                                      "
                                    />
                                    <label
                                      class="flex-1 cursor-pointer"
                                      [for]="'svc-' + serviceKey(service)"
                                    >
                                      <div class="font-medium">
                                        {{ service.name }}
                                      </div>
                                      <div class="text-sm text-600">
                                        {{ service.description }}
                                      </div>
                                    </label>
                                    <div
                                      class="text-sm font-semibold text-primary"
                                    >
                                      Vanaf €{{ serviceFromPrice(service) }}
                                    </div>
                                  </div>
                                }
                              </div>

                              @if (
                                step0Attempted() &&
                                selectedServiceIds().length === 0
                              ) {
                                <small
                                  id="step0-services-error"
                                  class="p-error"
                                  role="alert"
                                >
                                  Kies minimaal één dienst.
                                </small>
                              }
                            }

                            <div class="landing-price mt-3">
                              <div>
                                <div class="font-semibold">Geschatte prijs</div>
                                <div class="text-sm text-600">
                                  Exacte prijs hangt af van ras/vacht.
                                </div>
                              </div>
                              <div class="text-2xl font-bold text-primary">
                                €{{ estimatedPrice() }}
                              </div>
                            </div>
                          </div>
                        </div>
                      }

                      @case (1) {
                        <form [formGroup]="dogForm" class="grid">
                          <div class="col-12 md:col-6">
                            <label
                              class="block font-semibold mb-2"
                              for="dogName"
                            >
                              Naam van je hond
                              <span class="text-red-600" aria-hidden="true"
                                >*</span
                              >
                            </label>
                            <input
                              id="dogName"
                              pInputText
                              type="text"
                              formControlName="name"
                              [attr.aria-invalid]="
                                isInvalid(dogForm.controls.name)
                              "
                              [attr.aria-describedby]="'dogName-error'"
                              class="w-full"
                            />
                            @if (shouldShowError(dogForm.controls.name)) {
                              <small id="dogName-error" class="p-error">
                                Vul de naam van je hond in.
                              </small>
                            }
                          </div>

                          <div class="col-12 md:col-6">
                            <label
                              class="block font-semibold mb-2"
                              for="dogBreed"
                            >
                              Ras
                              <span class="text-red-600" aria-hidden="true"
                                >*</span
                              >
                            </label>
                            <p-select
                              inputId="dogBreed"
                              [options]="breedOptions()"
                              optionLabel="label"
                              optionValue="value"
                              formControlName="breedId"
                              placeholder="Kies een ras..."
                              [style]="{ width: '100%' }"
                              [attr.aria-invalid]="
                                isInvalid(dogForm.controls.breedId)
                              "
                              [attr.aria-describedby]="'dogBreed-error'"
                            />
                            @if (shouldShowError(dogForm.controls.breedId)) {
                              <small id="dogBreed-error" class="p-error">
                                Kies een ras.
                              </small>
                            }

                            @if (selectedBreedLabel()) {
                              <div class="text-xs text-600 mt-2">
                                Grootte (afgeleid van ras):
                                <span class="font-semibold">{{
                                  selectedBreedSizeLabel()
                                }}</span>
                              </div>
                            }
                          </div>

                          <div class="col-12 md:col-6">
                            <label
                              class="block font-semibold mb-2"
                              for="dogAge"
                            >
                              Leeftijd (optioneel)
                            </label>
                            <input
                              id="dogAge"
                              pInputText
                              type="number"
                              inputmode="numeric"
                              min="0"
                              max="25"
                              formControlName="ageYears"
                              [attr.aria-describedby]="'dogAge-error'"
                              class="w-full"
                            />
                            @if (shouldShowError(dogForm.controls.ageYears)) {
                              <small id="dogAge-error" class="p-error">
                                Vul een geldige leeftijd in.
                              </small>
                            }
                          </div>

                          <div class="col-12 md:col-6">
                            <label
                              class="block font-semibold mb-2"
                              for="bookingDate"
                            >
                              Gewenste datum
                              <span class="text-red-600" aria-hidden="true"
                                >*</span
                              >
                            </label>
                            <p-datepicker
                              inputId="bookingDate"
                              formControlName="date"
                              [minDate]="minDate"
                              dateFormat="dd-mm-yy"
                              [readonlyInput]="true"
                              [appendTo]="'body'"
                              styleClass="w-full"
                              [style]="{ width: '100%' }"
                              [attr.aria-invalid]="
                                isInvalid(dogForm.controls.date)
                              "
                              [attr.aria-describedby]="'bookingDate-error'"
                            />
                            @if (shouldShowError(dogForm.controls.date)) {
                              <small id="bookingDate-error" class="p-error">
                                Kies een datum (ma–vr).
                              </small>
                            }
                          </div>

                          <div class="col-12">
                            <div class="landing-price">
                              <div>
                                <div class="font-semibold">Geschatte prijs</div>
                                <div class="text-sm text-600">
                                  Op basis van ras en diensten.
                                </div>
                              </div>
                              <div class="text-2xl font-bold text-primary">
                                €{{ estimatedPrice() }}
                              </div>
                            </div>
                          </div>
                        </form>
                      }

                      @case (2) {
                        <form [formGroup]="ownerForm" class="grid">
                          <div class="col-12">
                            <div class="landing-summary">
                              <div class="grid">
                                <div class="col-12 md:col-6">
                                  <div class="font-semibold mb-2">
                                    Overzicht
                                  </div>
                                  <dl class="landing-dl">
                                    <dt>Diensten</dt>
                                    <dd>
                                      @if (selectedServiceIds().length === 0) {
                                        —
                                      } @else {
                                        {{ selectedServicesLabel() }}
                                      }
                                    </dd>
                                    <dt>Hond</dt>
                                    <dd>
                                      {{ dogForm.controls.name.value }}
                                      ({{ selectedBreedLabel() ?? '—' }})
                                    </dd>
                                    <dt>Grootte</dt>
                                    <dd>{{ selectedBreedSizeLabel() }}</dd>
                                    <dt>Datum</dt>
                                    <dd>{{ selectedDateLabel() }}</dd>
                                  </dl>
                                </div>
                                <div class="col-12 md:col-6">
                                  <div class="font-semibold mb-2">
                                    Totaal (schatting)
                                  </div>
                                  <div class="text-3xl font-bold text-primary">
                                    €{{ estimatedPrice() }}
                                  </div>
                                  <div class="text-sm text-600 mt-2">
                                    We stemmen de precieze tijd later af.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div class="col-12 md:col-6">
                            <label
                              class="block font-semibold mb-2"
                              for="ownerName"
                            >
                              Jouw naam
                              <span class="text-red-600" aria-hidden="true"
                                >*</span
                              >
                            </label>
                            <input
                              id="ownerName"
                              pInputText
                              type="text"
                              formControlName="name"
                              class="w-full"
                              [attr.aria-invalid]="
                                isInvalid(ownerForm.controls.name)
                              "
                              [attr.aria-describedby]="'ownerName-error'"
                            />
                            @if (shouldShowError(ownerForm.controls.name)) {
                              <small id="ownerName-error" class="p-error">
                                Vul je naam in.
                              </small>
                            }
                          </div>

                          <div class="col-12 md:col-6">
                            <label
                              class="block font-semibold mb-2"
                              for="ownerPhone"
                            >
                              Telefoonnummer
                              <span class="text-red-600" aria-hidden="true"
                                >*</span
                              >
                            </label>
                            <input
                              id="ownerPhone"
                              pInputText
                              type="tel"
                              formControlName="phone"
                              inputmode="tel"
                              autocomplete="tel"
                              class="w-full"
                              [attr.aria-invalid]="
                                isInvalid(ownerForm.controls.phone)
                              "
                              [attr.aria-describedby]="'ownerPhone-error'"
                            />
                            @if (shouldShowError(ownerForm.controls.phone)) {
                              <small id="ownerPhone-error" class="p-error">
                                Vul een telefoonnummer in.
                              </small>
                            }
                          </div>
                        </form>
                      }
                    }
                  </div>

                  <p-divider />

                  <div class="flex justify-content-between gap-2 flex-wrap">
                    <p-button
                      label="Vorige"
                      icon="pi pi-arrow-left"
                      severity="secondary"
                      [outlined]="true"
                      [disabled]="currentBookingStep() === 0"
                      (onClick)="previousBookingStep()"
                    />

                    <p-button
                      [label]="
                        currentBookingStep() === 2
                          ? 'Bevestig aanvraag'
                          : 'Volgende'
                      "
                      icon="pi pi-arrow-right"
                      iconPos="right"
                      [disabled]="isSubmittingBooking() || !canRequestBooking()"
                      (onClick)="nextBookingStep()"
                    />
                  </div>

                  <p-message
                    severity="warn"
                    styleClass="mt-3 w-full"
                    text="Dit is een aanvraag (nog geen definitieve afspraak). We nemen contact met je op om te bevestigen."
                  />
                </div>
              </p-card>
            </div>
          }

          <div class="text-center mt-4">
            <a
              class="landing-whatsapp"
              [href]="whatsAppLink"
              target="_blank"
              rel="noopener noreferrer"
            >
              Liever direct? Stuur een WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section
        id="contact"
        class="landing-section"
        aria-labelledby="contact-title"
      >
        <div class="landing-container">
          <div class="text-center mb-4">
            <h2 id="contact-title" class="landing-section-title">
              Neem contact op
            </h2>
            <p class="text-600 text-lg m-0">
              Vrijblijvend contact voor vragen of een afspraak
            </p>
          </div>

          <div class="grid">
            @for (method of contactMethods; track method.label) {
              <div class="col-12 md:col-4">
                <p-card styleClass="h-full landing-card">
                  <div class="text-center">
                    <div class="landing-icon mx-auto" aria-hidden="true">
                      <i class="pi" [class]="method.icon"></i>
                    </div>
                    <div class="font-semibold mt-2">{{ method.label }}</div>
                    <div class="text-600">{{ method.value }}</div>
                    <div class="mt-3">
                      <a
                        class="landing-contact-link"
                        [href]="method.link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                </p-card>
              </div>
            }
          </div>
        </div>
      </section>

      <section
        id="locatie"
        class="landing-section landing-alt"
        aria-labelledby="locatie-title"
      >
        <div class="landing-container">
          <div class="text-center mb-4">
            <h2 id="locatie-title" class="landing-section-title">Kom langs</h2>
            <p class="text-600 text-lg m-0">
              In deze demo tonen we geen echte locatiegegevens
            </p>
          </div>

          <div class="grid">
            <div class="col-12 lg:col-6">
              <p-card styleClass="landing-map-card">
                <div
                  class="landing-map landing-map--placeholder"
                  role="img"
                  aria-label="Kaart is verborgen in deze demo omgeving"
                >
                  <div class="text-center p-4">
                    <i class="pi pi-map text-primary" aria-hidden="true"></i>
                    <div class="text-lg font-semibold mt-2">
                      Kaart verborgen
                    </div>
                    <div class="text-sm text-600 mt-1">
                      In een echte omgeving staat hier een routekaart.
                    </div>
                  </div>
                </div>
              </p-card>
            </div>
            <div class="col-12 lg:col-6">
              <p-card>
                <div class="flex gap-3 align-items-start">
                  <div class="landing-icon" aria-hidden="true">
                    <i class="pi pi-map-marker"></i>
                  </div>
                  <div>
                    <div class="font-semibold text-xl">Adres</div>
                    <div class="text-700 mt-1">Verborgen in demo-omgeving</div>
                  </div>
                </div>

                <p-divider />

                <div class="grid">
                  <div class="col-12 md:col-6">
                    <div class="font-semibold">Parkeren</div>
                    <div class="text-600 mt-1">
                      In een echte omgeving kun je hier parkeertips tonen.
                    </div>
                  </div>
                  <div class="col-12 md:col-6">
                    <div class="font-semibold">Bereikbaarheid</div>
                    <div class="text-600 mt-1">Uitsluitend op afspraak.</div>
                  </div>
                </div>
              </p-card>
            </div>
          </div>
        </div>
      </section>

      <footer class="landing-footer">
        <div class="landing-container">
          <div class="grid">
            <div class="col-12 md:col-4">
              <div class="font-bold text-lg">Marlie TrimSalon</div>
              <div class="text-sm text-100 line-height-3 mt-2">
                Demo-omgeving: voorbeeldwebsite voor een hondentrimsalon.
              </div>
            </div>

            <div class="col-12 md:col-4">
              <div class="font-semibold">Contact</div>
              <div class="text-sm text-100 line-height-3 mt-2">
                Telefoon: 7:00 – 22:00<br />
                Email: info&#64;marliestrim.nl<br />
                Locatie: verborgen in demo
              </div>
            </div>

            <div class="col-12 md:col-4">
              <div class="font-semibold">Bereikbaarheid</div>
              <div class="text-sm text-100 line-height-3 mt-2">
                Alleen op afspraak<br />
                WhatsApp (snelste)<br />
                Email of bellen
              </div>
            </div>
          </div>

          <p-divider styleClass="landing-footer-divider" />

          <div
            class="flex flex-column md:flex-row justify-content-between align-items-center gap-2 text-sm text-100"
          >
            <div>© {{ currentYear }} Marlie TrimSalon</div>
          </div>
        </div>
      </footer>
    </main>
  `,
})
export class LandingComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly messageService = inject(MessageService);
  private readonly bookingRequestService = inject(BookingRequestService);
  private readonly serviceService = inject(ServiceService);
  private readonly packageService = inject(PackageService);
  private readonly breedService = inject(BreedService);
  private readonly pricingService = inject(PricingService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly doc = inject(DOCUMENT);
  private readonly storage = this.doc.defaultView?.localStorage ?? null;
  private readonly host = inject(ElementRef<HTMLElement>);

  private readonly demoNoticeStorageKey = 'trimsalon.demoNoticeAcknowledged.v1';

  readonly demoDialogVisible = signal(true);

  readonly currentYear = new Date().getFullYear();

  readonly catalogServices = toSignal(this.serviceService.getActive$(), {
    initialValue: [] as Service[],
  });

  readonly catalogPackages = toSignal(this.packageService.getActive$(), {
    initialValue: [] as Package[],
  });

  readonly catalogBreeds = toSignal(this.breedService.getActive$(), {
    initialValue: [] as Breed[],
  });

  readonly hasCatalogServices = computed(
    () => this.catalogServices().length > 0,
  );
  readonly hasCatalogPackages = computed(
    () => this.catalogPackages().length > 0,
  );

  // Booking requires services (packages are optional).
  readonly canRequestBooking = computed(() => this.hasCatalogServices());

  readonly breedOptions = computed(() =>
    this.catalogBreeds().map((b) => ({ label: b.name, value: b.id ?? '' })),
  );

  readonly step0Attempted = signal(false);
  readonly step1Attempted = signal(false);
  readonly step2Attempted = signal(false);
  readonly isSubmittingBooking = signal(false);

  readonly specialties = [
    {
      icon: 'pi-heart',
      title: 'Geduld & rust',
      description: 'Alle tijd om je hond op zijn gemak te stellen.',
    },
    {
      icon: 'pi-clock',
      title: 'Eigen tempo',
      description: 'Geen haast: elke hond mag zijn eigen tempo volgen.',
    },
    {
      icon: 'pi-shield',
      title: 'Vertrouwde omgeving',
      description: 'Rustige thuissalon, zonder drukte van andere honden.',
    },
  ];

  readonly reviews: Review[] = [
    {
      id: '1',
      name: 'Sandra van der Berg',
      rating: 5,
      comment:
        'Marlie is geweldig met mijn angstige hond. Zeer professioneel en lief.',
      date: '2024-01-15',
    },
    {
      id: '2',
      name: 'Peter Jansen',
      rating: 5,
      comment:
        'Eindelijk iemand die mijn moeilijke Terriër kan trimmen zonder stress. Top service!',
      date: '2024-01-10',
    },
    {
      id: '3',
      name: 'Linda Bakker',
      rating: 5,
      comment:
        'Mijn Poedel ziet er altijd prachtig uit. Marlie luistert goed en geeft fijne adviezen.',
      date: '2024-01-05',
    },
  ];

  readonly stars = Array.from({ length: 5 });

  readonly contactMethods = [
    {
      label: 'WhatsApp',
      value: 'Snelste reactie',
      link: 'https://wa.me/31612345678',
      icon: 'pi-whatsapp',
    },
    {
      label: 'Email',
      value: 'info@marliestrim.nl',
      link: 'mailto:info@marliestrim.nl',
      icon: 'pi-envelope',
    },
    {
      label: 'Telefoon',
      value: '7:00 – 22:00 uur',
      link: 'tel:+31612345678',
      icon: 'pi-phone',
    },
  ];

  readonly whatsAppLink = 'https://wa.me/31612345678';

  readonly minDate = new Date();

  readonly currentBookingStep = signal(0);
  readonly selectedPackageId = signal<CatalogId | 'custom' | null>(null);
  readonly selectedServiceIds = signal<CatalogId[]>([]);

  readonly dogForm: FormGroup<{
    name: FormControl<string>;
    breedId: FormControl<string>;
    ageYears: FormControl<number | null>;
    date: FormControl<Date | null>;
  }> = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required] }),
    breedId: this.fb.control('', { validators: [Validators.required] }),
    ageYears: this.fb.control<number | null>(null, {
      validators: [Validators.min(0), Validators.max(25)],
    }),
    date: this.fb.control<Date | null>(null, {
      validators: [Validators.required, this.weekdayDateValidator],
    }),
  });

  readonly ownerForm: FormGroup<{
    name: FormControl<string>;
    phone: FormControl<string>;
  }> = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required] }),
    phone: this.fb.control('', { validators: [Validators.required] }),
  });

  readonly bookingSteps = computed<MenuItem[]>(() => {
    const isStep0Invalid =
      this.step0Attempted() && this.selectedServiceIds().length === 0;
    const isStep1Invalid = this.step1Attempted() && this.dogForm.invalid;
    const isStep2Invalid = this.step2Attempted() && this.ownerForm.invalid;

    return [
      {
        label: 'Pakket & diensten',
        styleClass: isStep0Invalid ? 'landing-step--invalid' : undefined,
      },
      {
        label: 'Hond & datum',
        styleClass: isStep1Invalid ? 'landing-step--invalid' : undefined,
      },
      {
        label: 'Bevestigen',
        styleClass: isStep2Invalid ? 'landing-step--invalid' : undefined,
      },
    ];
  });

  constructor() {
    const demoNoticeAcknowledged =
      this.storage?.getItem(this.demoNoticeStorageKey) === '1';
    this.demoDialogVisible.set(!demoNoticeAcknowledged);

    this.title.setTitle('Marlie TrimSalon (demo) - Jouw hond, mijn passie');
    this.meta.updateTag({
      name: 'description',
      content:
        'Demo-omgeving (fictief): dit is geen echt bedrijf en de informatie op deze pagina is niet echt.',
    });
  }

  onDemoDialogVisibleChange(visible: boolean): void {
    this.demoDialogVisible.set(visible);
    if (!visible) {
      this.persistDemoNoticeAcknowledged();
    }
  }

  acknowledgeDemoNotice(): void {
    this.demoDialogVisible.set(false);
    this.persistDemoNoticeAcknowledged();
  }

  private persistDemoNoticeAcknowledged(): void {
    try {
      this.storage?.setItem(this.demoNoticeStorageKey, '1');
    } catch {
      // ignore storage errors
    }
  }

  scrollToTop(): void {
    const scrollContainer = this.getScrollContainer();
    if (!scrollContainer) {
      this.doc.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToId(id: string): void {
    const el = this.doc.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  formatNlDate(dateIso: string): string {
    const date = new Date(dateIso);
    try {
      return new Intl.DateTimeFormat('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateIso;
    }
  }

  onPackageSelected(packageId: CatalogId | 'custom' | null): void {
    this.selectedPackageId.set(packageId);

    if (packageId === null) {
      this.selectedServiceIds.set([]);
      return;
    }

    if (packageId === 'custom') {
      return;
    }

    const pkg = this.catalogPackages().find((p) => p.id === packageId);
    if (!pkg) {
      this.selectedServiceIds.set([]);
      return;
    }

    const serviceIds = (pkg.services ?? [])
      .map((s) => this.serviceKey(s))
      .filter((id) => id.length > 0);
    this.selectedServiceIds.set(serviceIds);
  }

  packageDescription(pkg: Package): string {
    const names = (pkg.services ?? []).map((s) => s.name).filter(Boolean);
    const preview = names.slice(0, 3).join(', ');
    if (names.length > 3) return `${preview}…`;
    return preview || 'Samenstelling op maat.';
  }

  serviceKey(service: Service): string {
    if (service.id) return service.id;
    return this.slugify(service.name);
  }

  serviceFromPrice(service: Service): number {
    const pricing = service.sizePricing?.pricing;
    if (!pricing) return 0;
    return Math.min(pricing.small, pricing.medium, pricing.large);
  }

  isServiceSelected(id: CatalogId): boolean {
    return this.selectedServiceIds().includes(id);
  }

  toggleService(id: CatalogId): void {
    const selectedPackage = this.selectedPackageId();
    if (selectedPackage && selectedPackage !== 'custom') {
      this.selectedPackageId.set('custom');
    }

    this.selectedServiceIds.update((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  selectedBreed(): Breed | undefined {
    const breedId = this.dogForm.controls.breedId.value;
    if (!breedId) return undefined;
    return this.catalogBreeds().find((b) => b.id === breedId);
  }

  selectedBreedLabel(): string | null {
    return this.selectedBreed()?.name ?? null;
  }

  selectedBreedSizeLabel(): string {
    const size = this.selectedBreed()?.size;
    if (!size) return '—';
    if (size === 'small') return 'Klein';
    if (size === 'medium') return 'Middel';
    return 'Groot';
  }

  estimatedPrice(): number {
    const breed = this.selectedBreed();
    const selectedPackageId = this.selectedPackageId();

    const packages: Package[] =
      selectedPackageId && selectedPackageId !== 'custom'
        ? this.catalogPackages().filter((p) => p.id === selectedPackageId)
        : [];

    const services: Service[] =
      packages.length > 0
        ? []
        : this.selectedServiceIds()
            .map((id) =>
              this.catalogServices().find((s) => this.serviceKey(s) === id),
            )
            .filter((s): s is Service => !!s);

    const calc = this.pricingService.calculateTotalPrice(
      services,
      packages,
      breed,
    );
    return Math.round(calc.totalPrice);
  }

  selectedServicesLabel(): string {
    const selectedPackageId = this.selectedPackageId();
    if (selectedPackageId && selectedPackageId !== 'custom') {
      const pkg = this.catalogPackages().find(
        (p) => p.id === selectedPackageId,
      );
      return pkg?.name ?? '—';
    }

    return this.selectedServiceIds()
      .map(
        (id) =>
          this.catalogServices().find((s) => this.serviceKey(s) === id)?.name,
      )
      .filter((v): v is string => Boolean(v))
      .join(', ');
  }

  selectedDateLabel(): string {
    const date = this.dogForm.controls.date.value;
    return date ? this.formatNlDate(date.toISOString()) : '—';
  }

  nextBookingStep(): void {
    const step = this.currentBookingStep();

    if (step === 0) {
      if (!this.canRequestBooking()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Boeken tijdelijk niet mogelijk',
          detail: this.hasCatalogPackages()
            ? 'Er zijn op dit moment geen diensten beschikbaar.'
            : 'Er zijn op dit moment geen pakketten en diensten beschikbaar.',
        });
        return;
      }

      this.step0Attempted.set(true);
      if (this.selectedServiceIds().length === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Kies minimaal één dienst',
          detail: 'Selecteer een pakket of kies losse diensten.',
        });
        return;
      }

      this.currentBookingStep.set(1);
      return;
    }

    if (step === 1) {
      this.step1Attempted.set(true);
      this.dogForm.markAllAsTouched();
      if (this.dogForm.invalid) {
        this.focusFirstInvalid();
        this.messageService.add({
          severity: 'error',
          summary: 'Controleer je invoer',
          detail: 'Vul de gegevens over je hond en datum in.',
        });
        return;
      }

      this.currentBookingStep.set(2);
      return;
    }

    // step === 2
    if (this.isSubmittingBooking()) {
      return;
    }

    this.step2Attempted.set(true);
    this.ownerForm.markAllAsTouched();
    if (this.ownerForm.invalid) {
      this.focusFirstInvalid();
      this.messageService.add({
        severity: 'error',
        summary: 'Controleer je contactgegevens',
        detail: 'Vul je naam en telefoonnummer in.',
      });
      return;
    }

    const customerKey = this.getOrCreateCustomerKey();
    const breed = this.selectedBreed();
    const selectedPackageId = this.selectedPackageId();

    const selectedPackage =
      selectedPackageId && selectedPackageId !== 'custom'
        ? this.catalogPackages().find((p) => p.id === selectedPackageId)
        : undefined;

    const selectedServices = this.selectedServiceIds()
      .map((id) =>
        this.catalogServices().find((s) => this.serviceKey(s) === id),
      )
      .filter((s): s is Service => !!s);

    this.isSubmittingBooking.set(true);

    this.bookingRequestService
      .createPublicRequest({
        customerKey,
        requestedDate: this.dogForm.controls.date.value as Date,
        dog: {
          name: this.dogForm.controls.name.value,
          breedId: this.dogForm.controls.breedId.value,
          breedName: breed?.name ?? null,
          size: breed?.size ?? null,
          ageYears: this.dogForm.controls.ageYears.value,
        },
        selection: {
          packageId:
            selectedPackage && selectedPackage.id ? selectedPackage.id : null,
          packageName: selectedPackage?.name ?? null,
          serviceIds: this.selectedServiceIds(),
          serviceNames: selectedServices.map((s) => s.name),
          estimatedTotal: this.estimatedPrice(),
        },
        owner: {
          name: this.ownerForm.controls.name.value,
          phone: this.ownerForm.controls.phone.value,
        },
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Aanvraag ontvangen',
            detail: 'We nemen zo snel mogelijk contact met je op.',
          });
          this.resetBooking();
          this.isSubmittingBooking.set(false);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Aanvraag mislukt',
            detail: 'Probeer het later opnieuw of stuur een WhatsApp.',
          });
          this.isSubmittingBooking.set(false);
        },
      });
  }

  previousBookingStep(): void {
    this.currentBookingStep.update((v) => Math.max(0, v - 1));
  }

  private resetBooking(): void {
    this.currentBookingStep.set(0);
    this.selectedPackageId.set(null);
    this.selectedServiceIds.set([]);
    this.dogForm.reset();
    this.ownerForm.reset();
    this.step0Attempted.set(false);
    this.step1Attempted.set(false);
    this.step2Attempted.set(false);
    this.isSubmittingBooking.set(false);
  }

  isInvalid(control: { invalid: boolean; touched: boolean }): boolean {
    return control.invalid && control.touched;
  }

  shouldShowError(control: { invalid: boolean; touched: boolean }): boolean {
    return control.invalid && control.touched;
  }

  private focusFirstInvalid(): void {
    const invalid = this.host.nativeElement.querySelector(
      '[aria-invalid="true"], .ng-invalid.ng-touched',
    ) as HTMLElement | null;
    invalid?.focus?.();
  }

  private getOrCreateCustomerKey(): string {
    const storageKey = 'trimsalon_customer_key';
    const existing = this.doc.defaultView?.localStorage?.getItem(storageKey);
    if (existing) return existing;

    const key = this.generateCustomerKey();
    this.doc.defaultView?.localStorage?.setItem(storageKey, key);
    return key;
  }

  private generateCustomerKey(): string {
    const bytes = new Uint8Array(16);
    const crypto = this.doc.defaultView?.crypto;
    if (crypto?.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      const seed = Date.now();
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = (Math.random() * 256 + (seed >> i % 8)) % 256;
      }
    }

    // Base64url without padding
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    const base64 = this.doc.defaultView?.btoa(binary) ?? '';
    return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  }

  private slugify(value: string): string {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private weekdayDateValidator(
    control: AbstractControl<Date | null>,
  ): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const day = value.getDay();
    return day === 0 || day === 6 ? { weekendNotAllowed: true } : null;
  }

  private getScrollContainer(): HTMLElement | null {
    // In deze app is `.content-outlet` de scroll-container (body heeft overflow hidden).
    return this.doc.querySelector<HTMLElement>('.content-outlet');
  }
}
