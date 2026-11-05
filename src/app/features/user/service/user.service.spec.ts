import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../../core/service/api.service';
import { UserService } from './user.service';

describe('UserService', () => {
  it('gets a user by ID from the user/{userID} endpoint', () => {
    const user = {
      userID: 15,
      userName: 'maria',
      name: 'María',
      apPaterno: 'López',
      apMaterno: 'Ruiz',
      email: 'maria@example.test',
      active: true,
      role: 'AGENT',
      areaID: 1,
      areaName: 'Soporte',
      createBy: null,
      createDate: null,
      updatedBy: null,
      updatedDate: null,
      deletedBy: null,
      deletedDate: null,
    };
    const api = {
      get: vi.fn(() => of({
        success: true,
        message: 'Usuario encontrado',
        data: user,
      })),
    };
    TestBed.configureTestingModule({
      providers: [UserService, { provide: ApiService, useValue: api }],
    });

    let result: unknown;
    TestBed.inject(UserService).getUserByID(15).subscribe((foundUser) => {
      result = foundUser;
    });

    expect(api.get).toHaveBeenCalledWith('user/15');
    expect(result).toEqual(user);
  });
});
