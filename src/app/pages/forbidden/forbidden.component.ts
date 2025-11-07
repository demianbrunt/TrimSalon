import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthenticationService } from './../../core/services/authentication.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [ButtonModule, RouterLink],
  template: `
    <div
      class="flex flex-column align-items-center justify-content-center p-4 h-full text-center"
      style="background: linear-gradient(135deg, var(--cactus-green-50) 0%, var(--p-surface-0) 100%);"
    >
      <span class="text-8xl mb-4 dog-animation">🐶</span>
      <h1 class="text-5xl font-bold mb-3 text-primary">Toegang geweigerd</h1>
      <p class="text-xl mb-5 text-600">
        Oeps! Het lijkt erop dat je geen toegang hebt tot dit hondenmandje.
      </p>
      <p-button
        label="Terug naar de startpagina"
        icon="pi pi-home"
        routerLink="/signin"
        size="large"
      ></p-button>
    </div>
  `,
})
export class ForbiddenComponent {
  protected authenticationService = inject(AuthenticationService);
}
