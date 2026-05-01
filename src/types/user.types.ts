export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  bio: string;
  verified: boolean;
  rating: number;
  totalSales: number;
  totalReviews: number;
  city: string;
  state: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string | null;
  reviewedId: string;
  rating: number;
  comment: string;
  productId: string;
  productTitle: string;
  createdAt: Date;
}
