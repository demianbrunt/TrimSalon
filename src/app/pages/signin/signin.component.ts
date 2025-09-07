import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { AuthenticationService } from '../../core/services/authentication.service';

@Component({
  standalone: true,
  imports: [CommonModule, Button],
  template: `
    <div
      class="flex flex-column align-items-center justify-content-center p-4 h-full text-center"
    >
      <span class="text-8xl mb-4" [class.pi-spin]="authService.isSigningIn()"
        >🐶</span
      >
      <h1 class="text-4xl font-bold mb-2">Inloggen</h1>
      <p class="text-lg mb-4">
        Een momentje, we snuffelen rond om je account te vinden!
      </p>
      <p-button label="Inloggen" icon="pi pi-home" (onClick)="signIn()">
      </p-button>
    </div>
  `,
})
export class SignInComponent implements OnInit {
  protected readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.navigateToCalendar();
      return;
    }

    if (this.authService.isSigningIn()) {
      return;
    }

    this.signIn();
  }

  signIn() {
    this.authService
      .signIn()
      .then(() => {
        console.log('AUTHED');
        this.navigateToCalendar();
      })
      .catch(() => {
        this.router.navigate(['/forbidden']);
      });
  }

  private navigateToCalendar() {
    this.router.navigate(['/calendar']);
  }
}
