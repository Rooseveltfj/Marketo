export type MessageType = 'text' | 'image' | 'offer' | 'system';
export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string;
  offerAmount?: number;
  offerStatus?: OfferStatus;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface Chat {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  buyerId: string;
  sellerId: string;
  participants: string[];
  lastMessage: Partial<Message> | null;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  updatedAt: Date;
}
