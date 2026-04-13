import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageComponent } from './message-page.component';
import { UserService } from '../../services/user.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: '',
})
class MockSidebarComponent {}

@Component({
  selector: 'app-chat',
  standalone: true,
  template: '',
})
class MockChatComponent {}

describe('MessageComponent (page)', () => {
  let component: MessageComponent;
  let fixture: ComponentFixture<MessageComponent>;
  let userService: { currentUser: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userService = {
      currentUser: vi.fn().mockReturnValue({ id: 1, name: 'Anders', email: 'test@family.com' }),
    };

    await TestBed.configureTestingModule({
      imports: [MessageComponent, RouterTestingModule.withRoutes([])],
      providers: [{ provide: UserService, useValue: userService }],
    })
      .overrideComponent(MessageComponent, {
        set: {
          imports: [MockSidebarComponent, MockChatComponent],
        },
      })
      .compileComponents();

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
