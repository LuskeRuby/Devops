import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointsInput } from './points-input';

describe('PointsInput', () => {
  let component: PointsInput;
  let fixture: ComponentFixture<PointsInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PointsInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PointsInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
