import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { UserService } from '../../../features/user/service/user.service';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let logout: ReturnType<typeof vi.fn>;
  let router: Router;
  let sessionUser = {
    userID: 9,
    userName: 'carlos',
    name: 'Carlos',
    email: 'carlos@example.test',
    role: 'ADMIN',
    areaID: null as number | null,
    areaName: null as string | null,
  };

  beforeEach(() => {
    logout = vi.fn();
    sessionUser = {
      userID: 9,
      userName: 'carlos',
      name: 'Carlos',
      email: 'carlos@example.test',
      role: 'ADMIN',
      areaID: null,
      areaName: null,
    };
    TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: { logout, user: () => sessionUser } },
        {
          provide: UserService,
          useValue: {
            getUserByID: vi.fn((userID: number) => of({
              userID,
              userName: 'carlos',
              name: 'Carlos',
              apPaterno: 'Mendoza',
              apMaterno: 'López',
              email: 'carlos@example.test',
              active: true,
              role: 'ADMIN',
              areaID: null,
              areaName: null,
              createBy: null,
              createDate: null,
              updatedBy: null,
              updatedDate: null,
              deletedBy: null,
              deletedDate: null,
            })),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(Sidebar);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  it('shows the authenticated user full name, role and initials', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Carlos Mendoza López');
    expect(compiled.textContent).toContain('Administrador');
    expect(compiled.textContent).toContain('CL');
    expect(compiled.textContent).not.toContain('IT Admin');
  });

  it('shows the translated supervisor role', () => {
    sessionUser.role = 'SUPERVISOR';
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Supervisor');
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
