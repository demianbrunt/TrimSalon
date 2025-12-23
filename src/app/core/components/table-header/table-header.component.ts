import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DataView } from 'primeng/dataview';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table } from 'primeng/table';
import { MobileService } from '../../services/mobile.service';

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
          (input)="filter(searchInput.value)"
          [placeholder]="placeholder"
          class="w-full"
        />
      </p-iconfield>

      <div class="table-header__actions">
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
  `,
})
export class TableHeaderComponent {
  private readonly mobileService = inject(MobileService);

  get isMobile() {
    return this.mobileService.isMobile;
  }

  @Input() title!: string;
  @Input() placeholder = 'Zoeken...';
  @Input() addLabel = 'Nieuw';
  @Input() showAdd = true;
  @Input({ required: true }) table!: Table | DataView;
  @Output() addClick = new EventEmitter<void>();

  filter(value: string): void {
    if (this.table instanceof Table) {
      this.table.filterGlobal(value, 'contains');
    } else {
      this.table.filter(value, 'contains');
    }
  }
}
