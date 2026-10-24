import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../../core/service/api.service';
import { PriorityService } from './priority.service';

describe('PriorityService', () => {
  it('accepts API priorities with null colors', () => {
    const api = {
      get: vi.fn(() => of({
        success: true,
        message: 'Priority encontrada',
        data: [{
          active: true,
          backgroundColor: null,
          createdBy: null,
          createdDate: '2026-10-24T04:05:28.494Z',
          dotColor: null,
          name: 'Baja',
          priorityID: 1,
          updatedBy: null,
          updatedDate: null,
        }],
      })),
    };
    TestBed.configureTestingModule({
      providers: [
        PriorityService,
        { provide: ApiService, useValue: api },
      ],
    });

    const service = TestBed.inject(PriorityService);
    let priorities: unknown;
    service.getAllPriorities().subscribe((result) => {
      priorities = result;
    });

    expect(priorities).toEqual([{
      active: true,
      backgroundColor: null,
      createdBy: null,
      createdDate: '2026-10-24T04:05:28.494Z',
      dotColor: null,
      name: 'Baja',
      priorityID: 1,
      updatedBy: null,
      updatedDate: null,
    }]);
  });
});
