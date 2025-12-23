import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-form-shell',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './form-shell.component.html',
  styleUrls: ['./form-shell.component.css'],
})
export class FormShellComponent {
  @Input({ required: true }) title!: string;

  /** Optional short helper text under the title (kept subtle). */
  @Input() subtitle?: string;

  /** Wrapper classes for the outer container (defaults match existing forms). */
  @Input() outerClass = 'md:p-4';

  /** PrimeNG Card styleClass. */
  @Input() cardClass = 'responsive-card mx-auto w-full max-w-4xl';
}
