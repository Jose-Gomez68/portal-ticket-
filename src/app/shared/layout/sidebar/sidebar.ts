import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authSession.logout();
    void this.router.navigateByUrl('/login');
  }
}
