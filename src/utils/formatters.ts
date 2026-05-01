import { formatDistanceToNowStrict, isYesterday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProductCondition } from '@/types/product.types';

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatRelativeTime(date: Date): string {
  if (isYesterday(date)) {
    return 'ontem';
  }
  
  const distance = formatDistanceToNowStrict(date, { addSuffix: true, locale: ptBR });
  
  // If it's more than 2 days, show date like "15 mai"
  const diffDays = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 2) {
    return format(date, "d MMM", { locale: ptBR });
  }

  return distance;
}

export function formatCondition(c: ProductCondition): string {
  const map: Record<ProductCondition, string> = {
    'new': 'Novo',
    'like-new': 'Seminovo',
    'good': 'Bom estado',
    'fair': 'Marcas de uso',
    'poor': 'Com defeito/Para peças'
  };
  return map[c] || c;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export function generateInitials(name: string): string {
  const parts = name.trim().split(' ').filter(p => p.length > 0);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return '?';
}

export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Ensure the color is not too light or too dark by combining it with a base color
  const color = `#${((hash & 0x00FFFFFF) | 0x444444).toString(16).padStart(6, '0')}`;
  return color;
}
