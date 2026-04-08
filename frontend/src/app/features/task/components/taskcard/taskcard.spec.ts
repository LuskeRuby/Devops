import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { TaskcardComponent } from './taskcard';

describe('TaskcardComponent', () => {
  let component: TaskcardComponent;
  let fixture: ComponentFixture<TaskcardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskcardComponent]
    })
      .overrideComponent(TaskcardComponent, {
        set: {
          template: '<div></div>',
          imports: []
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TaskcardComponent);
    component = fixture.componentInstance;

    component.task = {
      id: 1,
      title: 'Test task',
      description: '',
      checked: false,
      createdAt: new Date()
    } as any;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
