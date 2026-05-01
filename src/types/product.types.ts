export type ProductCondition = 'new' | 'like-new' | 'good' | 'fair' | 'poor';
export type ProductStatus = 'active' | 'sold' | 'paused' | 'deleted';
export type SortBy = 'recent' | 'price-asc' | 'price-desc';

export interface Category {
  id: string;
  name: string;
  icon: string; // Keep for backward compat/fallback
  iconName: string; // For Lucide icons
  color: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  condition: ProductCondition;
  status: ProductStatus;
  category: Category;
  subcategory?: Subcategory;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerAvatar: string | null;
  sellerRating: number;
  sellerVerified: boolean;
  city: string;
  state: string;
  neighborhood?: string;
  views: number;
  favorites: number;
  negotiable: boolean;
  boosted: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  query?: string;
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition[];
  city?: string;
  sortBy?: SortBy;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  data: Product[];
  lastDoc: any;
  hasMore: boolean;
}
