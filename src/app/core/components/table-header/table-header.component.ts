import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DataView } from 'primeng/dataview';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table } from 'primeng/table';

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
  template: `
    <div
      class="flex justify-content-between align-items-center flex-column md:flex-row"
    >
      @if (title) {
        <h2 class="m-0 mb-2 md:mb-0">{{ title }}</h2>
      }
      <div class="flex justify-content-between gap-2 w-full md:w-auto">
        <p-iconfield>
          <p-inputicon class="pi pi-search" />
          <input
            pInputText
            type="text"
            #searchInput
            (input)="filter(searchInput.value)"
            [placeholder]="placeholder"
            class="p-inputtext-sm w-full"
          />
        </p-iconfield>
        <p-button
          [label]="addLabel"
          icon="pi pi-plus"
          (click)="addClick.emit()"
          styleClass="p-button-sm"
        ></p-button>
      </div>
    </div>
  `,
})
export class TableHeaderComponent {
  @Input() title!: string;
  @Input() placeholder = 'Zoeken...';
  @Input() addLabel = 'Nieuw';
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
