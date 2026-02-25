import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskPage } from './task-page';

describe('TaskPage', () => {
  let component: TaskPage;
  let fixture: ComponentFixture<TaskPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
