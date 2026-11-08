export type HighlightPlacement = 'hero' | 'showcase' | 'category_block';
export type HighlightTheme = 'dark' | 'light' | 'brand' | 'neutral';

export interface AdminHighlightProduct {
  id: string;
  name: string;
  price: number;
  mainImageUrl: string | null;
}

export interface AdminHighlight {
  id: string;
  placement: HighlightPlacement;
  displayOrder: number;
  title: string;
  subtitle: string | null;
  label: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  product?: AdminHighlightProduct | null;
  theme: HighlightTheme;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminHighlightInput {
  title: string;
  subtitle?: string | null;
  label?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  productId?: string | null;
  placement: HighlightPlacement;
  theme?: HighlightTheme;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  image?: File | null;
}

export type UpdateAdminHighlightInput = Partial<CreateAdminHighlightInput>;

export interface HighlightReorderItem {
  id: string;
  displayOrder: number;
}
