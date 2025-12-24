import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SwipeDirective } from '../../directives/swipe.directive';
import { AuthenticationService } from '../../services/authentication.service';
import { MobileService } from '../../services/mobile.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, ButtonModule, SwipeDirective],
  template: `
    <div
      class="flex justify-content-between align-items-center shadow-3 bg-primary"
      [ngClass]="isMobile ? 'px-3 py-2' : 'px-4 py-3'"
      appSwipe
      (swipeRight)="goBack()"
      (swipeLeft)="goForward()"
    >
      <div
        class="flex align-items-center"
        [ngClass]="isMobile ? 'gap-2' : 'gap-3'"
      >
        <img
          src="icons/icon-144x144.png"
          alt="TrimSalon Logo"
          [ngClass]="isMobile ? 'h-2rem' : 'h-3rem'"
          style="object-fit: contain;"
        />
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
  private readonly location = inject(Location);

  get isMobile() {
    return this.mobileService.isMobile;
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
  }

  goBack(): void {
    this.location.back();
  }

  goForward(): void {
    this.location.forward();
  }
}
