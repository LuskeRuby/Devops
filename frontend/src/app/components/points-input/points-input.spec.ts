import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointsInputComponent } from './points-input';

describe('PointsInputComponent', () => {
  let component: PointsInputComponent;
  let fixture: ComponentFixture<PointsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PointsInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PointsInputComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
