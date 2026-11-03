import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let logout: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(() => {
    logout = vi.fn();
    TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: { logout } },
      ],
    });
    fixture = TestBed.createComponent(Sidebar);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  it('clears the local session and navigates to login when logging out', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    const logoutButton = Array.from(buttons).find((button) =>
      button.textContent?.includes('Cerrar sesión'),
    );
    if (!logoutButton) {
      throw new Error('Logout button was not rendered.');
    }
    logoutButton.dispatchEvent(new Event('click'));

    expect(logout).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
