import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { vi } from 'vitest';

import { MemberItemComponent } from '../member-item/member-item';
import { UserService } from '../../../services/user.service';

describe('MemberItemComponent', () => {
  let component: MemberItemComponent;
  let fixture: ComponentFixture<MemberItemComponent>;

  const userServiceMock = {
    getImageUrl: vi.fn().mockReturnValue('/img/test.png')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberItemComponent],
      providers: [
        { provide: UserService, useValue: userServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA] // ignore child component
    }).compileComponents();

    fixture = TestBed.createComponent(MemberItemComponent);
    component = fixture.componentInstance;

    (component as any).member = () => ({
      id: 1,
      name: 'Test User',
      role: 'child',
      imageId: 1,
      totalPoints: 100
    });

    (component as any).showActions = () => true;
    (component as any).isCurrentUser = () => false;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getImageUrl', () => {
    component.getImageUrl(1);
    expect(userServiceMock.getImageUrl).toHaveBeenCalledWith(1);
  });
});
