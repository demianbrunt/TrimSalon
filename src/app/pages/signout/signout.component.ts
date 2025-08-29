import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AuthenticationService } from '../../core/services/authentication.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `<p>U wordt uitgelogd...</p>`,
})
export class SignoutComponent implements OnInit {
  private readonly authService = inject(AuthenticationService);

  ngOnInit(): void {
    this.authService.logout().subscribe();
  }
}
