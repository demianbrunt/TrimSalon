import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { StepsModule } from 'primeng/steps';

import { FormShellComponent } from '../form-shell/form-shell.component';

@Component({
  selector: 'app-wizard-shell',
  standalone: true,
  imports: [CommonModule, FormShellComponent, StepsModule],
  templateUrl: './wizard-shell.component.html',
  styleUrls: ['./wizard-shell.component.css'],
})
export class WizardShellComponent {
  @Input({ required: true }) title!: string;

  @Input({ required: true }) steps: MenuItem[] = [];

  @Input() activeIndex = 0;
  @Output() readonly activeIndexChange = new EventEmitter<number>();

  /** Wrapper classes for the outer container. */
  @Input() outerClass = 'md:p-4';

  /** Card styleClass used by the internal form shell. */
  @Input() cardClass = 'responsive-card mx-auto w-full max-w-4xl';

  get stepCounterLabel(): string {
    const total = this.steps?.length ?? 0;
    const current = Math.min(this.activeIndex + 1, Math.max(total, 1));
    return `Stap ${current} van ${total}`;
  }

  onActiveIndexChange(index: number): void {
    this.activeIndexChange.emit(index);
  }
}
