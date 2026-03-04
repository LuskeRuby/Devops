import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskcardComponent } from './taskcard';

describe('TaskcardComponent', () => {
  let component: TaskcardComponent;
  let fixture: ComponentFixture<TaskcardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskcardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskcardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
