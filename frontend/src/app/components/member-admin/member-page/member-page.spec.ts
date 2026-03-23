import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberPage } from './member-page';

describe('MemberPage', () => {
  let component: MemberPage;
  let fixture: ComponentFixture<MemberPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
