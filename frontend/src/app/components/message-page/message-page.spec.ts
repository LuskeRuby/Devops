import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageComponent } from './message-page.component';
import { UserService } from '../../services/user.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('MessageComponent (page)', () => {
  let component: MessageComponent;
  let fixture: ComponentFixture<MessageComponent>;
  let userService: { currentUser: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userService = {
      currentUser: vi.fn().mockReturnValue({ id: 1, name: 'Anders', email: 'test@family.com' }),
    };

    await TestBed.configureTestingModule({
      imports: [MessageComponent],
      providers: [
        { provide: UserService, useValue: userService },
      ],
      schemas: [NO_ERRORS_SCHEMA], // Ignores app-sidebar and app-chat
    }).compileComponents();

    fixture = TestBed.createComponent(MessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('sets selectedUserId from current user', () => {
    expect(component.selectedUserId).toBe(1);
  });

  it('sets selectedUserId to null when no user', () => {
    userService.currentUser.mockReturnValue(null);

    // Re-create to pick up new mock
    fixture = TestBed.createComponent(MessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.selectedUserId).toBeNull();
  });

  it('renders the chat header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.chat-header h2')?.textContent).toContain('Familie Chat');
  });
});
