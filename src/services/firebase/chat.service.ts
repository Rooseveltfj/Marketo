import { dbModular as db, storageModular as storage } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  runTransaction,
  writeBatch,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Chat, Message, MessageType, OfferStatus } from '@/types/chat.types';

export async function getOrCreateChat(productId: string, sellerId: string, buyerId: string, productData: any): Promise<Chat> {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('productId', '==', productId),
    where('buyerId', '==', buyerId),
    where('sellerId', '==', sellerId)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { ...docSnap.data(), id: docSnap.id } as Chat;
  }

  const newChatRef = doc(chatsRef);
  const now = serverTimestamp();
  
  const newChat = {
    productId,
    productTitle: productData.title,
    productImage: productData.images?.[0] || '',
    productPrice: productData.price,
    buyerId,
    sellerId,
    participants: [buyerId, sellerId],
    lastMessage: null,
    unreadCount: { [buyerId]: 0, [sellerId]: 0 },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newChatRef, newChat);
  return { ...newChat, id: newChatRef.id, createdAt: new Date(), updatedAt: new Date() } as any as Chat;
}

export function listenChats(userId: string, callback: (chats: Chat[]) => void): () => void {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id } as Chat));
    callback(chats);
  });
}

export function listenMessages(chatId: string, callback: (messages: Message[]) => void): () => void {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        readAt: data.readAt?.toDate ? data.readAt.toDate() : data.readAt,
      } as Message;
    });
    callback(messages);
  });
}

export async function sendTextMessage(chatId: string, senderId: string, content: string, otherUserId: string): Promise<void> {
  const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
  const chatRef = doc(db, 'chats', chatId);
  
  const msgData = {
    chatId,
    senderId,
    type: 'text',
    content,
    read: false,
    createdAt: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    const chatDoc = await transaction.get(chatRef);
    if (chatDoc.exists()) {
      transaction.set(msgRef, msgData);
      const currentUnread = chatDoc.data()?.unreadCount || {};
      transaction.update(chatRef, {
        lastMessage: msgData,
        updatedAt: serverTimestamp(),
        unreadCount: {
          ...currentUnread,
          [otherUserId]: (currentUnread[otherUserId] || 0) + 1
        }
      });
    }
  });
}

export async function sendImageMessage(chatId: string, senderId: string, imageUri: string, otherUserId: string): Promise<void> {
  // 1. Fetch image and convert to blob for Web SDK
  const response = await fetch(imageUri);
  const blob = await response.blob();

  // 2. Upload to storage
  const filename = imageUri.split('/').pop() || `img_${Date.now()}.jpg`;
  const storageRef = ref(storage, `chats/${chatId}/${Date.now()}_${filename}`);
  
  await uploadBytes(storageRef, blob);
  const downloadUrl = await getDownloadURL(storageRef);

  // 3. Create message
  const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
  const chatRef = doc(db, 'chats', chatId);
  
  const msgData = {
    chatId,
    senderId,
    type: 'image',
    content: downloadUrl,
    read: false,
    createdAt: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    const chatDoc = await transaction.get(chatRef);
    if (chatDoc.exists()) {
      transaction.set(msgRef, msgData);
      const currentUnread = chatDoc.data()?.unreadCount || {};
      transaction.update(chatRef, {
        lastMessage: { ...msgData, content: '📷 Imagem' },
        updatedAt: serverTimestamp(),
        unreadCount: { ...currentUnread, [otherUserId]: (currentUnread[otherUserId] || 0) + 1 }
      });
    }
  });
}

export async function sendOffer(chatId: string, senderId: string, amount: number, otherUserId: string): Promise<void> {
  const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
  const chatRef = doc(db, 'chats', chatId);
  
  const msgData = {
    chatId,
    senderId,
    type: 'offer',
    content: `R$ ${amount.toFixed(2)}`,
    offerAmount: amount,
    offerStatus: 'pending',
    read: false,
    createdAt: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    const chatDoc = await transaction.get(chatRef);
    if (chatDoc.exists()) {
      transaction.set(msgRef, msgData);
      const currentUnread = chatDoc.data()?.unreadCount || {};
      transaction.update(chatRef, {
        lastMessage: { ...msgData, content: '🤝 Nova oferta' },
        updatedAt: serverTimestamp(),
        unreadCount: { ...currentUnread, [otherUserId]: (currentUnread[otherUserId] || 0) + 1 }
      });
    }
  });
}

export async function respondToOffer(chatId: string, messageId: string, accept: boolean, responderId: string): Promise<void> {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  const chatRef = doc(db, 'chats', chatId);
  
  await runTransaction(db, async (transaction) => {
    const msgDoc = await transaction.get(msgRef);
    if (!msgDoc.exists()) throw new Error("Offer not found");
    
    transaction.update(msgRef, {
      offerStatus: accept ? 'accepted' : 'rejected'
    });
    
    const sysMsgRef = doc(collection(db, 'chats', chatId, 'messages'));
    const sysData = {
      chatId,
      senderId: 'system',
      type: 'system',
      content: `Oferta ${accept ? 'aceita' : 'recusada'}`,
      createdAt: serverTimestamp(),
    };
    transaction.set(sysMsgRef, sysData);
    transaction.update(chatRef, { lastMessage: sysData, updatedAt: serverTimestamp() });
  });
}

export async function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  
  await runTransaction(db, async (transaction) => {
    const chatDoc = await transaction.get(chatRef);
    if (chatDoc.exists()) {
      const unreadCount = chatDoc.data()?.unreadCount || {};
      if (unreadCount[userId] > 0) {
        transaction.update(chatRef, {
          unreadCount: { ...unreadCount, [userId]: 0 }
        });
      }
    }
  });

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(
    messagesRef,
    where('read', '==', false),
    where('senderId', '!=', userId)
  );
    
  const unreadQuery = await getDocs(q);
    
  if (!unreadQuery.empty) {
    const batch = writeBatch(db);
    const now = serverTimestamp();
    unreadQuery.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { read: true, readAt: now });
    });
    await batch.commit();
  }
}

export async function setTypingStatus(chatId: string, userId: string, isTyping: boolean): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`typing_${userId}`]: isTyping
  });
}

export function listenTypingStatus(chatId: string, otherUserId: string, callback: (isTyping: boolean) => void): () => void {
  const chatRef = doc(db, 'chats', chatId);
  return onSnapshot(chatRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(!!data?.[`typing_${otherUserId}`]);
    }
  });
}
