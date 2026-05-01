import { dbModular as db } from './config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  startAfter, 
  Timestamp,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { Product, ProductFilters, PaginatedProducts } from '@/types/product.types';

export async function getProducts(filters: ProductFilters, lastDoc?: any): Promise<PaginatedProducts> {
  const productsRef = collection(db, 'products');
  let qConstraints: any[] = [];
  
  // Base filters
  if (filters.categoryId) {
    qConstraints.push(where('category.id', '==', filters.categoryId));
  }
  
  if (filters.city) {
    qConstraints.push(where('city', '==', filters.city));
  }

  // Sort logic
  if (filters.sortBy === 'price-asc') {
    qConstraints.push(orderBy('price', 'asc'));
  } else if (filters.sortBy === 'price-desc') {
    qConstraints.push(orderBy('price', 'desc'));
  } else {
    qConstraints.push(orderBy('createdAt', 'desc'));
  }

  // Pagination
  if (lastDoc) {
    qConstraints.push(startAfter(lastDoc));
  }
  
  const pageLimit = filters.limit || 20;
  qConstraints.push(limit(pageLimit));

  const q = query(productsRef, ...qConstraints);
  const snapshot = await getDocs(q);
  
  const data = snapshot.docs.map((docSnap) => {
    const rawData = docSnap.data();
    return { 
      ...rawData, 
      id: docSnap.id,
      createdAt: rawData.createdAt?.toDate() || new Date(),
      updatedAt: rawData.updatedAt?.toDate() || new Date()
    } as Product;
  });
  
  return {
    data,
    lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
    hasMore: snapshot.docs.length === pageLimit,
  };
}

export async function getProductById(id: string): Promise<Product> {
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) throw new Error('Produto não encontrado');
  
  const rawData = docSnap.data();
  return { 
    ...rawData, 
    id: docSnap.id,
    createdAt: rawData.createdAt?.toDate() || new Date(),
    updatedAt: rawData.updatedAt?.toDate() || new Date()
  } as Product;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'favorites'>): Promise<Product> {
  const productsRef = collection(db, 'products');
  const newDocRef = doc(productsRef);
  
  const newProduct = {
    ...data,
    id: newDocRef.id,
    views: 0,
    favorites: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(newDocRef, newProduct);
  
  // Return the product with local dates for immediate UI feedback
  return {
    ...newProduct,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const docRef = doc(db, 'products', id);
  await deleteDoc(docRef);
}

export async function getUserProducts(userId: string): Promise<Product[]> {
  const productsRef = collection(db, 'products');
  const q = query(
    productsRef, 
    where('sellerId', '==', userId), 
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const rawData = docSnap.data();
    return { 
      ...rawData, 
      id: docSnap.id,
      createdAt: rawData.createdAt?.toDate() || new Date(),
      updatedAt: rawData.updatedAt?.toDate() || new Date()
    } as Product;
  });
}

export async function toggleFavoriteOnServer(productId: string, userId: string, isFav: boolean): Promise<void> {
  const productRef = doc(db, 'products', productId);
  
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(productRef);
    if (!docSnap.exists()) throw new Error('Produto não encontrado');
    
    const currentFavorites = docSnap.data()?.favorites || 0;
    transaction.update(productRef, {
      favorites: isFav ? currentFavorites + 1 : Math.max(0, currentFavorites - 1)
    });
  });
}

export async function incrementViews(productId: string): Promise<void> {
  const productRef = doc(db, 'products', productId);
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(productRef);
    if (docSnap.exists()) {
      const currentViews = docSnap.data()?.views || 0;
      transaction.update(productRef, { views: currentViews + 1 });
    }
  });
}
