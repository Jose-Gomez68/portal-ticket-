import { Component, inject } from '@angular/core';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

@Component({
  imports: [ThemeToggle],
  selector: 'app-topbar',
  styleUrl: './topbar.css',
  templateUrl: './topbar.html',
})
export class Topbar {
  private readonly authSession = inject(AuthSessionService);

  protected initials(): string {
    const name = this.authSession.user()?.name.trim();
    if (!name) {
      return 'U';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.length === 1
      ? parts[0].slice(0, 2).toLocaleUpperCase()
      : `${parts[0][0]}${parts.at(-1)?.[0] ?? ''}`.toLocaleUpperCase();
  }
}
