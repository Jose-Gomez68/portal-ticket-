import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { LoginService } from './service/login.service';

@Component({
  imports: [FormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected passwordVisible = false;
  protected submitMessage = '';
  protected isSubmitting = false;

  protected togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  protected onSubmit(): void {
    this.sendLoginRequest();
  }

  protected sendLoginRequest(): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.submitMessage = '';
    this.loginService
      .login({ email: this.email, password: this.password })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.password = '';
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error: unknown) => {
          this.submitMessage = getLoginErrorMessage(error);
        },
      });
  }
}

function getLoginErrorMessage(error: unknown): string {
  if (
    error instanceof HttpErrorResponse &&
    typeof error.error === 'object' &&
    error.error !== null &&
    'message' in error.error &&
    typeof error.error.message === 'string'
  ) {
    return error.error.message;
  }

  return error instanceof Error
    ? error.message
    : 'No fue posible iniciar sesión. Inténtalo nuevamente.';
}
