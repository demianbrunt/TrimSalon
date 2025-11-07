import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div
      class="flex justify-content-between align-items-center px-4 py-3 shadow-3"
      style="background: linear-gradient(135deg, #86A789 0%, #739072 100%);"
    >
      <div class="flex align-items-center gap-3">
        <span class="text-5xl">🐾</span>
        <div>
          <div
            class="font-bold text-3xl text-white"
            style="letter-spacing: 0.5px;"
          >
            TrimSalon
          </div>
          <div class="text-sm text-white opacity-90">
            Professionele Hondentrimsalon
          </div>
        </div>
      </div>

      <div class="flex align-items-center">
        @if (authService.isAuthenticated()) {
          <p-button
            (click)="signOut()"
            icon="pi pi-sign-out"
            label="Uitloggen"
            [outlined]="true"
            severity="secondary"
            styleClass="text-white border-white hover:bg-white hover:text-primary"
            pTooltip="Uitloggen"
          />
        }
      </div>
    </div>
  `,
})
export class TopNavComponent {
  readonly authService = inject(AuthenticationService);

  async signOut(): Promise<void> {
    await this.authService.signOut();
  }
}
