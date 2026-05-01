import { Category } from '@/types/product.types';

export const CATEGORIES: Category[] = [
  { id: 'electronics', name: 'Eletrônicos', icon: '📱', iconName: 'Smartphone', color: '#6C47FF', subcategories: [
    { id: 'phones', name: 'Celulares', categoryId: 'electronics' },
    { id: 'computers', name: 'Computadores', categoryId: 'electronics' },
    { id: 'tablets', name: 'Tablets', categoryId: 'electronics' },
    { id: 'games', name: 'Games', categoryId: 'electronics' },
  ]},
  { id: 'vehicles', name: 'Veículos', icon: '🚗', iconName: 'Car', color: '#FF6B35', subcategories: [
    { id: 'cars', name: 'Carros', categoryId: 'vehicles' },
    { id: 'motorcycles', name: 'Motos', categoryId: 'vehicles' },
  ]},
  { id: 'realestate', name: 'Imóveis', icon: '🏠', iconName: 'Home', color: '#00C48C', subcategories: [
    { id: 'rent', name: 'Aluguel', categoryId: 'realestate' },
    { id: 'sale', name: 'Venda', categoryId: 'realestate' },
  ]},
  { id: 'fashion', name: 'Moda', icon: '👗', iconName: 'Shirt', color: '#FF4D9F', subcategories: [
    { id: 'womens', name: 'Feminino', categoryId: 'fashion' },
    { id: 'mens', name: 'Masculino', categoryId: 'fashion' },
  ]},
  { id: 'home', name: 'Casa', icon: '🛋️', iconName: 'Lamp', color: '#FFB800', subcategories: [
    { id: 'furniture', name: 'Móveis', categoryId: 'home' },
    { id: 'appliances', name: 'Eletrodomésticos', categoryId: 'home' },
  ]},
  { id: 'sports', name: 'Esportes', icon: '⚽', iconName: 'Trophy', color: '#00C48C', subcategories: [
    { id: 'outdoor', name: 'Ao ar livre', categoryId: 'sports' },
    { id: 'gym', name: 'Academia', categoryId: 'sports' },
  ]},
  { id: 'other', name: 'Outros', icon: '📦', iconName: 'Package', color: '#6B6B6B', subcategories: [] },
];
