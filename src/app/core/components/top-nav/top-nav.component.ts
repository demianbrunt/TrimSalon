import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AuthenticationService } from '../../services/authentication.service';
import { MobileService } from '../../services/mobile.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div
      class="flex justify-content-between align-items-center shadow-3 bg-primary"
      [ngClass]="isMobile ? 'px-3 py-2' : 'px-4 py-3'"
    >
      <div
        class="flex align-items-center"
        [ngClass]="isMobile ? 'gap-2' : 'gap-3'"
      >
        <span [ngClass]="isMobile ? 'text-3xl' : 'text-5xl'">🐾</span>
        <div>
          <div
            class="font-bold text-white"
            [ngClass]="isMobile ? 'text-xl' : 'text-3xl'"
            style="letter-spacing: 0.5px;"
          >
            TrimSalon
          </div>
          @if (!isMobile) {
            <div class="text-sm text-white opacity-90">
              Professionele Hondentrimsalon
            </div>
          }
        </div>
      </div>

      <div class="flex align-items-center">
        @if (authService.isAuthenticated()) {
          <p-button
            (click)="signOut()"
            icon="pi pi-sign-out"
            [label]="isMobile ? '' : 'Uitloggen'"
            [text]="true"
            [rounded]="isMobile"
            severity="secondary"
            [size]="isMobile ? 'small' : undefined"
            styleClass="text-white hover:text-primary"
            pTooltip="Uitloggen"
          />
        }
      </div>
    </div>
  `,
})
export class TopNavComponent {
  readonly authService = inject(AuthenticationService);
  private readonly mobileService = inject(MobileService);

  get isMobile() {
    return this.mobileService.isMobile;
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
  }
}
