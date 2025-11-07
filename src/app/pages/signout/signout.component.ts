import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthenticationService } from '../../core/services/authentication.service';

@Component({
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: ` <div
    class="flex flex-column align-items-center justify-content-center p-4 h-full text-center"
    style="background: linear-gradient(135deg, var(--cactus-green-50) 0%, var(--p-surface-0) 100%);"
  >
    <span class="text-8xl mb-4 dog-animation">🐶</span>
    <h1 class="text-5xl font-bold mb-3 text-primary">U bent uitgelogd</h1>
    <p class="text-xl mb-5 text-600">
      Woef! Ik heb overal gesnuffeld, maar kon geen koekje vinden!
    </p>

    <p-button
      label="Inloggen"
      icon="pi pi-home"
      (onClick)="router.navigate(['/signin'])"
      size="large"
    ></p-button>
  </div>`,
})
export class SignoutComponent implements OnInit {
  private readonly authService = inject(AuthenticationService);
  protected readonly router = inject(Router);

  ngOnInit(): void {
    void this.authService.signOut();
  }
}
