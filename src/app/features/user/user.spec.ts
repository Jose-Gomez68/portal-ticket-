import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { User } from './user';
import { UserService } from './service/user.service';
import { AreaService } from '../area/service/area.service';

describe('User', () => {
  let fixture: ComponentFixture<User>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [User],
      providers: [
        {
          provide: UserService,
          useValue: {
            getAllUsers: () => of([
              {
                userID: 1,
                userName: 'test.user',
                name: 'Test',
                apPaterno: 'User',
                apMaterno: 'Example',
                email: 'test@example.com',
                active: true,
                role: 'REQUESTER',
                areaID: 1,
                areaName: 'Soporte',
                createBy: null,
                createDate: null,
                updatedBy: null,
                updatedDate: null,
                deletedBy: null,
                deletedDate: null,
              },
            ]),
            createUser: () => of({}),
            updateUser: () => of({}),
            deleteUser: () => of(undefined),
          },
        },
        {
          provide: AreaService,
          useValue: {
            getAll: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(User);
    fixture.detectChanges();
  });

  it('renders the users view', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Usuarios');
  });

  it('renders the reusable pagination within the users table', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-pagination')).not.toBeNull();
    expect(compiled.querySelector('table tbody tr')?.textContent).toContain('test.user');
  });
});
