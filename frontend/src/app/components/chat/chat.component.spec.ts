import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChatComponent } from './chat.component';
import { WebSocketService } from '../../services/websocket/web-socket.service';
import { MessageService, MessageResponse } from '../../services/message/message.service';
import { UserService } from '../../services/user.service';
import { of, Subject } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let wsService: {
    connect: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  let messageService: { getMessages: ReturnType<typeof vi.fn> };
  let userService: {
    currentUser: ReturnType<typeof vi.fn>;
    getImageUrl: ReturnType<typeof vi.fn>;
  };

  const mockUser = { id: 1, name: 'Anders', email: 'test@family.com' };

  const mockMessages: MessageResponse[] = [
    {
      id: 1,
      content: 'Hej!',
      timestamp: '2026-03-28T10:00:00',
      username: 'Anders',
      userId: 1,
      imageId: 1,
    },
    {
      id: 2,
      content: 'Godmorgen',
      timestamp: '2026-03-28T10:05:00',
      username: 'Svend',
      userId: 2,
      imageId: 2,
    },
  ];

  beforeEach(async () => {
    wsService = {
      connect: vi.fn(),
      send: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
    };

    messageService = {
      getMessages: vi.fn().mockReturnValue(of(mockMessages)),
    };

    userService = {
      currentUser: vi.fn().mockReturnValue(mockUser),
      getImageUrl: vi.fn((id: number) => `/api/images/${id}`),
    };

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: WebSocketService, useValue: wsService },
        { provide: MessageService, useValue: messageService },
        { provide: UserService, useValue: userService },
      ],
      schemas: [NO_ERRORS_SCHEMA], // Ignore child component templates
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('loads message history on init', () => {
      fixture.detectChanges(); // triggers ngOnInit

      expect(messageService.getMessages).toHaveBeenCalledWith('test@family.com');
      expect(component.messages).toHaveLength(2);
    });

    it('connects to WebSocket with family email', () => {
      fixture.detectChanges();

      expect(wsService.connect).toHaveBeenCalledWith(
        'test@family.com',
        expect.any(Function), // onMessage callback
        expect.any(Function), // onConnected callback
        expect.any(Function), // onDisconnected callback
      );
    });

    it('clears isConnected when the WebSocket connection is lost', () => {
      wsService.connect.mockImplementation(
        (_email: string, _onMsg: any, onConnected: () => void, onDisconnected: () => void) => {
          onConnected();
          onDisconnected();
        },
      );

      fixture.detectChanges();

      expect(component.isConnected).toBe(false);
    });

    it('does not connect when no user is selected', () => {
      userService.currentUser.mockReturnValue(null);

      fixture.detectChanges();

      expect(wsService.connect).not.toHaveBeenCalled();
      expect(messageService.getMessages).not.toHaveBeenCalled();
    });

    it('sets isConnected when WebSocket connects', () => {
      // Capture the onConnected callback and invoke it
      wsService.connect.mockImplementation(
        (_email: string, _onMsg: any, onConnected: () => void) => {
          onConnected();
        },
      );

      fixture.detectChanges();

      expect(component.isConnected).toBe(true);
    });

    it('reloads the history after every (re)connect, so messages missed while offline show up', () => {
      const missed: MessageResponse = {
        id: 3,
        content: 'Sendt mens du var offline',
        timestamp: '2026-03-28T10:20:00',
        username: 'Ida',
        userId: 3,
        imageId: 3,
      };
      messageService.getMessages
        .mockReturnValueOnce(of(mockMessages))
        .mockReturnValueOnce(of([...mockMessages, missed]));
      let onConnected!: () => void;
      wsService.connect.mockImplementation((_email: string, _onMsg: any, connected: () => void) => {
        onConnected = connected;
      });

      fixture.detectChanges();
      expect(component.messages).toHaveLength(2);

      onConnected(); // the socket (re)connects and is subscribed

      expect(messageService.getMessages).toHaveBeenCalledTimes(2);
      expect(component.messages).toHaveLength(3);
      expect(component.messages[2].content).toBe('Sendt mens du var offline');
    });

    it('shows a message once, even when it arrives both live and in the history', () => {
      wsService.connect.mockImplementation((_email: string, onMsg: (msg: any) => void) => {
        onMsg(mockMessages[1]); // id 2 is also in the history
      });

      fixture.detectChanges();

      expect(component.messages.map((m) => m.id)).toEqual([1, 2]);
    });

    it('keeps a live message that arrives before the history has loaded', () => {
      const history$ = new Subject<MessageResponse[]>();
      messageService.getMessages.mockReturnValue(history$);
      const live: MessageResponse = {
        id: 3,
        content: 'Ny besked!',
        timestamp: '2026-03-28T10:10:00',
        username: 'Ida',
        userId: 3,
        imageId: 3,
      };
      wsService.connect.mockImplementation((_email: string, onMsg: (msg: any) => void) => {
        onMsg(live);
      });

      fixture.detectChanges();
      expect(component.messages.map((m) => m.id)).toEqual([3]);

      history$.next(mockMessages); // the history arrives later and must not overwrite the live message

      expect(component.messages.map((m) => m.id)).toEqual([1, 2, 3]);
    });

    it('orders messages by time, not by arrival', () => {
      const earlier: MessageResponse = {
        id: 9,
        content: 'Tidligere',
        timestamp: '2026-03-28T09:00:00',
        username: 'Ida',
        userId: 3,
        imageId: 3,
      };
      wsService.connect.mockImplementation((_email: string, onMsg: (msg: any) => void) => {
        onMsg(earlier);
      });

      fixture.detectChanges();

      expect(component.messages.map((m) => m.id)).toEqual([9, 1, 2]);
    });

    it('appends incoming WebSocket messages to the list', () => {
      const incomingMsg: MessageResponse = {
        id: 3,
        content: 'Ny besked!',
        timestamp: '2026-03-28T10:10:00',
        username: 'Ida',
        userId: 3,
        imageId: 3,
      };

      wsService.connect.mockImplementation((_email: string, onMsg: (msg: any) => void) => {
        // Simulate receiving a message after connection
        onMsg(incomingMsg);
      });

      fixture.detectChanges();

      expect(component.messages).toHaveLength(3);
      expect(component.messages[2].content).toBe('Ny besked!');
    });
  });

  describe('send', () => {
    beforeEach(() => {
      wsService.connect.mockImplementation(
        (_email: string, _onMsg: any, onConnected: () => void) => {
          onConnected();
        },
      );
      fixture.detectChanges();
    });

    it('sends message via WebSocket and clears input', () => {
      component.messageText = 'Hej fra test!';

      component.send();

      expect(wsService.send).toHaveBeenCalledWith(1, 'Hej fra test!', 'test@family.com');
      expect(component.messageText).toBe('');
    });

    it('keeps the typed text when the message could not be sent', () => {
      wsService.send.mockReturnValue(false);
      component.messageText = 'Hej fra test!';

      component.send();

      expect(component.messageText).toBe('Hej fra test!');
    });
  });

  describe('cleanup', () => {
    it('disconnects WebSocket on destroy', () => {
      fixture.detectChanges();

      component.ngOnDestroy();

      expect(wsService.disconnect).toHaveBeenCalled();
    });
  });

  describe('helper methods', () => {
    it('isDifferentDay returns true for different dates', () => {
      expect(component.isDifferentDay('2026-03-27T23:59:00', '2026-03-28T00:01:00')).toBe(true);
    });

    it('isDifferentDay returns false for same date', () => {
      expect(component.isDifferentDay('2026-03-28T10:00:00', '2026-03-28T14:00:00')).toBe(false);
    });

    it('formatDateLabel returns "I dag" for today', () => {
      const now = new Date().toISOString();
      expect(component.formatDateLabel(now)).toBe('I dag');
    });

    it('formatDateLabel returns "I går" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(component.formatDateLabel(yesterday.toISOString())).toBe('I går');
    });

    it('getImageUrl delegates to UserService', () => {
      const result = component.getImageUrl(5);
      expect(userService.getImageUrl).toHaveBeenCalledWith(5);
      expect(result).toBe('/api/images/5');
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('displays all messages', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const messageBubbles = compiled.querySelectorAll('.bubble');
      expect(messageBubbles.length).toBe(2);
    });

    it('marks own messages with "mine" class', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const wrappers = compiled.querySelectorAll('.message-wrapper');
      expect(wrappers[0].classList.contains('mine')).toBe(true); // userId 1 = current user
      expect(wrappers[1].classList.contains('other')).toBe(true); // userId 2 = other user
    });

    it('shows avatar only for other users messages', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const avatars = compiled.querySelectorAll('.message-avatar');
      // Only the "other" message (Svend, userId 2) should have an avatar
      expect(avatars.length).toBe(1);
    });

    it('disables send button when not connected', () => {
      component.isConnected = false;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });
});
