import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TotalPointsDisplayComponent } from './total-points-display';

describe('TotalPointsDisplayComponent', () => {
  let component: TotalPointsDisplayComponent;
  let fixture: ComponentFixture<TotalPointsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalPointsDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TotalPointsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
