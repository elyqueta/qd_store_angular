export interface AdminCreateProductInput {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
}

export interface AdminUpdateProductInput {
  categoryId?: string;
  name?: string;
  description?: string | null;
  price?: number;
  originalPrice?: number | null;
  badge?: string | null;
}

export interface AdminCreateProductImageInput {
  url: string;
  displayOrder?: number;
  width?: number;
  height?: number;
  format?: string;
  sizeBytes?: number;
}

export interface AdminUpdateProductImageInput {
  url?: string;
  displayOrder?: number;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  sizeBytes?: number | null;
}

export interface AdminCreateProductSpecificationInput {
  specKey: string;
  specValue: string;
  displayOrder: number;
}

export interface AdminUpdateProductSpecificationInput {
  specKey?: string;
  specValue?: string;
  displayOrder?: number;
}
