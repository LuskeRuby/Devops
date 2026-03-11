import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RewardsDisplayComponent } from './rewards-display.component';
import { PointsStore } from '../../services/points-store.service';

describe('RewardsDisplayComponent', () => {
    let component: RewardsDisplayComponent;
    let fixture: ComponentFixture<RewardsDisplayComponent>;
    let store: PointsStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RewardsDisplayComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(RewardsDisplayComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(PointsStore);
        store.setTotalPoints(0);
        store.setTargetPoints(100);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should calculate rewards correctly', () => {
        store.setTotalPoints(250);
        store.setTargetPoints(100);
        fixture.detectChanges();
        expect(component.totalRewards()).toBe(2);
    });

    it('should not break when targetPoints is 0', () => {
        store.setTotalPoints(250);
        store.setTargetPoints(0);
        fixture.detectChanges();
        expect(component.totalRewards()).toBe(250); // safeTarget becomes 1
    });
});
