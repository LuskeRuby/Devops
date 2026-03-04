import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMemberPage } from './create-member-page';

describe('CreateMemberPage', () => {
  let component: CreateMemberPage;
  let fixture: ComponentFixture<CreateMemberPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMemberPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMemberPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
