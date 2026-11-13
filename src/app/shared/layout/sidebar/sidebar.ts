import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import type { Subscription } from 'rxjs';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { USER_ROLES } from '../../../features/user/model/user.model';
import type { UserModel } from '../../../features/user/model/user.model';
import { UserService } from '../../../features/user/service/user.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnDestroy, OnInit {
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private userRequest: Subscription | null = null;
  protected readonly profile = signal<UserModel | null>(null);
  protected readonly profileError = signal('');

  ngOnInit(): void {
    const userID = this.authSession.user()?.userID;
    if (userID === undefined) {
      return;
    }

    this.userRequest = this.userService.getUserByID(userID).subscribe({
      next: (user) => this.profile.set(user),
      error: () => this.profileError.set('No se pudo cargar el perfil completo.'),
    });
  }

  ngOnDestroy(): void {
    this.userRequest?.unsubscribe();
  }

  protected displayName(): string {
    const profile = this.profile();
    const fullName = profile
      ? [profile.name, profile.apPaterno, profile.apMaterno].filter(Boolean).join(' ').trim()
      : '';
    return fullName || this.authSession.user()?.name || 'Usuario';
  }

  protected roleName(): string {
    const role = this.authSession.user()?.role;
    return USER_ROLES.find((item) => item.value === role)?.label ?? 'Usuario';
  }

  protected initials(): string {
    const parts = this.displayName().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'U';
    }
    return parts.length === 1
      ? parts[0].slice(0, 2).toLocaleUpperCase()
      : `${parts[0][0]}${parts.at(-1)?.[0] ?? ''}`.toLocaleUpperCase();
  }

  protected logout(): void {
    this.authSession.logout();
    void this.router.navigateByUrl('/login');
  }
}
