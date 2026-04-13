import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PointsProgressComponent } from './points-progress.component';
import { PointsStore } from '../../services/points-store.service';

describe('PointsProgressComponent', () => {
  let component: PointsProgressComponent;
  let fixture: ComponentFixture<PointsProgressComponent>;
  let store: PointsStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PointsProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PointsProgressComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(PointsStore);
    store.setTotalPoints(0);
    store.setTargetPoints(100);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate progress correctly', () => {
    store.setTotalPoints(50);
    store.setTargetPoints(100);
    fixture.detectChanges();
    expect(component.progress()).toBe(50);
  });

  it('should fall back safely when targetPoints is 0', () => {
    store.setTotalPoints(25);
    store.setTargetPoints(0);
    fixture.detectChanges();
    expect(component.progress()).toBe(0); // safeTarget becomes 1, so 0/1 * 100
    expect(component.currentLevelPoints()).toBe(0); // 25 % 1 === 0
  });
});
