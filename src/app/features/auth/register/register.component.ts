import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  };

  isSubmitting = false;
  error: string | null = null;

  constructor(private readonly router: Router) {}

  async handleSubmit(): Promise<void> {
    if (!this.form.name.trim() || !this.form.email.trim() || !this.form.password.trim()) {
      this.error = 'Completa todos los campos obligatorios.';
      return;
    }

    if (this.form.password !== this.form.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.form.agreeTerms) {
      this.error = 'Debes aceptar los términos y condiciones.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      void this.router.navigate(['/dashboard']);
    } catch (_error) {
      this.error = 'Ocurrió un problema al crear tu cuenta. Intenta nuevamente.';
    } finally {
      this.isSubmitting = false;
    }
  }

  handleBack(): void {
    void this.router.navigate(['/']);
  }

  handleLogin(): void {
    void this.router.navigate(['/login']);
  }
}
