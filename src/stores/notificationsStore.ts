import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: 'new_message' | 'offer_received' | 'offer_accepted' | 'price_drop' | 'product_interest';
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [
    // Mock initial data for UI showcase
    {
      id: 'n1',
      type: 'new_message',
      title: 'Nova mensagem de Maria',
      body: 'Você aceita 200 reais no controle?',
      isRead: false,
      createdAt: new Date(),
      data: { chatId: 'chat_123' }
    },
    {
      id: 'n2',
      type: 'offer_received',
      title: 'Nova oferta recebida',
      body: 'João fez uma oferta no seu iPhone 12',
      isRead: false,
      createdAt: new Date(Date.now() - 86400000), // yesterday
      data: { productId: 'prod_456' }
    }
  ],
  unreadCount: 2,
  addNotification: (n) => set((state) => {
    const isUnread = !n.isRead;
    return {
      notifications: [n, ...state.notifications],
      unreadCount: isUnread ? state.unreadCount + 1 : state.unreadCount
    };
  }),
  markAsRead: (id) => set((state) => {
    const notifs = state.notifications.map(n => {
      if (n.id === id && !n.isRead) {
        return { ...n, isRead: true };
      }
      return n;
    });
    return {
      notifications: notifs,
      unreadCount: notifs.filter(n => !n.isRead).length
    };
  }),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    unreadCount: 0
  })),
  removeNotification: (id) => set((state) => {
    const filtered = state.notifications.filter(n => n.id !== id);
    return {
      notifications: filtered,
      unreadCount: filtered.filter(n => !n.isRead).length
    };
  })
}));
