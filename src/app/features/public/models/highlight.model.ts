export type HighlightPlacement = 'hero' | 'showcase' | 'category_block';

export interface HighlightProductSummary {
  id: string;
  name: string;
  slug?: string | null;
  price?: number;
  mainImageUrl?: string | null;
}

export interface HighlightCategorySummary {
  id: string;
  label: string;
  slug?: string | null;
}

export interface Highlight {
  id: string;
  placement: HighlightPlacement;
  displayOrder: number;
  title: string;
  subtitle?: string | null;
  label?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  theme?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  product?: HighlightProductSummary | null;
  category?: HighlightCategorySummary | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HighlightListResponse {
  status: 'success';
  data: Highlight[];
  count?: number;
}
