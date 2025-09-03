import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthenticationService } from '../../core/services/authentication.service';

@Component({
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div
      class="flex-grow-1 flex align-items-center justify-content-center h-full"
    >
      <p-button
        label="Login met Google"
        icon="pi pi-google"
        (onClick)="login()"
      ></p-button>
    </div>
  `,
})
export class SignInComponent {
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  login(): void {
    this.authService.loginWithGoogle().subscribe((user) => {
      if (user) {
        this.router.navigate(['/calendar']);
      }
    });
  }
}
