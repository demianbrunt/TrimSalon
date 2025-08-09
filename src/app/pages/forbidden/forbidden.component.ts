import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  imports: [ButtonModule, RouterLink],
  template: `
    <div
      class="flex flex-column align-items-center justify-content-center p-4 h-full text-center"
    >
      <span class="text-8xl mb-4">🐶</span>
      <h1 class="text-4xl font-bold mb-2">Toegang geweigerd</h1>
      <p class="text-lg mb-4">
        Oeps! Het lijkt erop dat je geen toegang hebt tot dit hondenmandje.
      </p>
      <p-button
        label="Terug naar de startpagina"
        icon="pi pi-home"
        routerLink="/calendar"
      ></p-button>
    </div>
  `,
})
export class ForbiddenComponent {}
