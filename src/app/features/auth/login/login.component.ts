import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  credentials = {
    email: '',
    password: '',
  };

  isSubmitting = false;
  error: string | null = null;

  constructor(private readonly router: Router) {}

  async handleSubmit(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    try {
      await this.router.navigate(['/dashboard']);
    } catch (_error) {
      this.error = 'Ocurrió un problema al iniciar sesión. Intenta nuevamente.';
    } finally {
      this.isSubmitting = false;
    }
  }

  handleBack(): void {
    void this.router.navigate(['/']);
  }
}
