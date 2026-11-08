import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { CommerceApiService } from '../data-access/commerce-api.service';
import { Notification, PageResult } from '../models/commerce.model';
import { NotificationsPage } from './notifications.page';

const notifications: PageResult<Notification> = {
  items: [
    {
      id: 'notification-1',
      userId: 'user-1',
      type: 'system',
      message: 'Primeira notificação',
      isRead: false,
      createdAt: '2026-11-08T00:00:00.000Z',
    },
    {
      id: 'notification-2',
      userId: 'user-1',
      type: 'order',
      message: 'Segunda notificação',
      isRead: false,
      createdAt: '2026-11-08T00:00:00.000Z',
    },
  ],
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1,
};

describe('NotificationsPage', () => {
  let markNotificationRead: ReturnType<typeof vi.fn>;
  let markAllNotificationsRead: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    markNotificationRead = vi.fn();
    markAllNotificationsRead = vi.fn();
    toastError = vi.fn();

    await TestBed.configureTestingModule({
      imports: [NotificationsPage],
      providers: [
        ...provideAppI18n(),
        {
          provide: CommerceApiService,
          useValue: {
            listNotifications: () => of(notifications),
            markNotificationRead,
            markAllNotificationsRead,
          },
        },
        { provide: ToastService, useValue: { error: toastError } },
      ],
    }).compileComponents();
  });

  it('marks a notification read immediately and restores it if the request fails', async () => {
    const request = new Subject<Notification>();
    markNotificationRead.mockReturnValue(request);
    const fixture = TestBed.createComponent(NotificationsPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const page = fixture.componentInstance;
    page.markRead(notifications.items[0]);

    expect(page.result()?.items[0].isRead).toBe(true);
    expect(page.pendingReadIds().has('notification-1')).toBe(true);
    expect(page.hasUnread()).toBe(true);

    request.error(new ApiError(503, 'Serviço indisponível.', [], null, null));
    expect(page.result()?.items[0].isRead).toBe(false);
    expect(page.pendingReadIds().has('notification-1')).toBe(false);
    expect(toastError).toHaveBeenCalledOnce();
  });

  it('marks all notifications read immediately while the request is pending', async () => {
    const request = new Subject<number>();
    markAllNotificationsRead.mockReturnValue(request);
    const fixture = TestBed.createComponent(NotificationsPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const page = fixture.componentInstance;
    page.markAllRead();

    expect(page.hasUnread()).toBe(false);
    expect(page.markingAllRead()).toBe(true);

    request.next(2);
    request.complete();
    expect(page.markingAllRead()).toBe(false);
    expect(page.result()?.items.every((notification) => notification.isRead)).toBe(true);
  });
});
