import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { SelectMemberPageComponent } from './select-member-page.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

describe('SelectMemberPageComponent', () => {
  let component: SelectMemberPageComponent;
  let fixture: ComponentFixture<SelectMemberPageComponent>;

  const userServiceMock = {
    getUsersByFamilyEmail: vi.fn().mockReturnValue(of([])),
    getImageUrl: vi.fn().mockReturnValue('/img/test.png'),
  };

  const authServiceMock = {
    familyEmail$: of('test@family.com'),
  };

  const routerMock = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectMemberPageComponent],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectMemberPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init when familyEmail is present', () => {
    expect(userServiceMock.getUsersByFamilyEmail).toHaveBeenCalledWith('test@family.com');
  });

  it('should navigate when selecting a user', () => {
    const user = { id: 1, name: 'Test' } as any;

    component.selectUser(user);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/member-pin'], { state: { user } });
  });

  it('should calculate rewards correctly', () => {
    expect(component.calculateRewards(250)).toBe(2);
  });
});
