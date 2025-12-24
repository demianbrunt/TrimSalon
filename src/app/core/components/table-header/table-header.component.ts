import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { DataView } from 'primeng/dataview';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table } from 'primeng/table';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MobileService } from '../../services/mobile.service';

let nextTableHeaderId = 0;

@Component({
  selector: 'app-table-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
  ],
  styleUrls: ['./table-header.component.css'],
  template: `
    <div class="table-header">
      <div
        class="grid grid-nogutter justify-content-between align-items-center gap-2"
      >
        @if (title) {
          <h2 class="col-12 md:col-6 m-0">{{ title }}</h2>
        }

        <p-iconfield class="flex-1 md:max-w-20rem">
          <p-inputicon class="pi pi-search" />
          <input
            pInputText
            type="text"
            #searchInput
            pSize="small"
            [value]="query"
            (input)="onQueryInput(searchInput.value)"
            [placeholder]="placeholder"
            class="w-full"
          />
        </p-iconfield>

        <div class="table-header__actions">
          @if (showFilters) {
            <p-button
              [label]="filtersLabel"
              icon="pi pi-filter"
              size="small"
              [text]="true"
              [attr.aria-expanded]="filtersOpen"
              [attr.aria-controls]="filtersPanelId"
              [attr.aria-label]="filtersAriaLabel"
              (click)="toggleFilters()"
            ></p-button>
          }

          <ng-content select="[header-actions]"></ng-content>
        </div>

        @if (showAdd) {
          <p-button
            [label]="addLabel"
            icon="pi pi-plus"
            size="small"
            (click)="addClick.emit()"
          ></p-button>
        }
      </div>

      @if (showFilters) {
        <div
          class="table-header__filters-panel"
          [class.is-open]="filtersOpen"
          [attr.aria-hidden]="!filtersOpen"
          [attr.inert]="filtersOpen ? null : ''"
          [id]="filtersPanelId"
        >
          <div class="table-header__filters">
            <ng-content select="[header-filters]"></ng-content>
          </div>
        </div>
      }
    </div>
  `,
})
export class TableHeaderComponent implements OnInit, OnChanges {
  private readonly mobileService = inject(MobileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queryInput$ = new Subject<string>();

  private appliedQuery = '';

  readonly filtersPanelId = `tableHeaderFilters_${++nextTableHeaderId}`;
  filtersOpen = false;

  get isMobile() {
    return this.mobileService.isMobile;
  }

  @Input() title!: string;
  @Input() placeholder = 'Zoeken...';
  @Input() addLabel = 'Nieuw';
  @Input() showAdd = true;
  @Input() showFilters = false;
  @Input() filtersLabel = 'Filters';
  @Input() filtersAriaLabel = 'Filters';
  @Input({ required: true }) table!: Table | DataView;
  @Input() query = '';
  @Input() queryDebounceMs = 250;
  @Output() addClick = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<string>();

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  filter(value: string): void {
    if (this.table instanceof Table) {
      this.table.filterGlobal(value, 'contains');
    } else {
      this.table.filter(value, 'contains');
    }
  }

  ngOnInit(): void {
    this.queryInput$
      .pipe(
        debounceTime(this.queryDebounceMs),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.queryChange.emit(value);
      });

    if (this.query) {
      this.applyQuery(this.query);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!('query' in changes)) return;
    if (this.appliedQuery === this.query) return;
    this.applyQuery(this.query);
  }

  onQueryInput(value: string): void {
    this.query = value;
    this.applyQuery(value);
    this.queryInput$.next(value);
  }

  private applyQuery(value: string): void {
    this.query = value;
    this.appliedQuery = value;
    this.filter(value);
  }
}
