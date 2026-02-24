import { TestBed } from '@angular/core/testing';

import { TaskAssigned } from './task-assigned';

describe('TaskAssigned', () => {
  let service: TaskAssigned;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskAssigned);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
