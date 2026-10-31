import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  protected email = '';
  protected password = '';
  protected passwordVisible = false;
  protected submitMessage = '';

  protected togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  protected onSubmit(): void {
    this.submitMessage = 'La autenticación aún no está conectada.';
  }
}
