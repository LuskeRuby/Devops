import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TotalPointsDisplayComponent } from './total-points-display';

describe('TotalPointsDisplayComponent', () => {
  let component: TotalPointsDisplayComponent;
  let fixture: ComponentFixture<TotalPointsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalPointsDisplayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TotalPointsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // calculation ko initialize karne ke liye zaroori hai
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate progress correctly', () => {
    component.totalPoints = 50;
    component.targetPoints = 100;
    expect(component.progress).toBe(50);
  });
});