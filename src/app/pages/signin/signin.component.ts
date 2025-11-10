import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { BaseComponent } from '../../core/components/base/base.component';
import { AuthenticationService } from '../../core/services/authentication.service';

@Component({
  standalone: true,
  imports: [CommonModule, Button],
  template: `
    <div
      class="flex flex-column align-items-center justify-content-center p-4 h-full text-center"
    >
      <div class="max-w-30rem w-full">
        <img
          [class.pi-spin]="authService.isSigningIn()"
          src="icons/icon-512x512.png"
          alt="TrimSalon Logo"
          class="mb-4 w-8rem"
        />
        <h1 class="text-5xl font-bold mb-3">Inloggen</h1>
        <p class="text-xl mb-5 text-600">
          @if (authService.isSigningIn()) {
            <span>Je wordt doorgestuurd naar Google...</span>
          } @else {
            Klik hieronder om in te loggen met je Google account
          }
        </p>
        <p-button
          label="Inloggen met Google"
          icon="pi pi-google"
          (onClick)="signIn()"
          [disabled]="authService.isSigningIn()"
          size="large"
          styleClass="w-full md:w-auto"
        >
        </p-button>
      </div>
    </div>
  `,
})
export class SignInComponent extends BaseComponent implements OnInit {
  protected readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      const returnUrl = this.getFromQueryString('returnUrl') ?? '/appointments';
      this.router.navigate([returnUrl]);
      return;
    }

    // Note: redirect result is handled in AuthenticationService constructor
    // No need to call signIn() automatically - let user click the button
  }

  signIn(): void {
    // Store returnUrl in sessionStorage so we can use it after redirect
    const returnUrl = this.getFromQueryString('returnUrl') ?? '/appointments';
    sessionStorage.setItem('auth_return_url', returnUrl);

    // Trigger redirect-based sign in
    void this.authService.signIn();
    // Browser will redirect to Google, then back to this app
  }
}
