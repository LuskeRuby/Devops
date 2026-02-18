import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Taskcard } from './taskcard';

describe('Taskcard', () => {
  let component: Taskcard;
  let fixture: ComponentFixture<Taskcard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Taskcard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Taskcard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
