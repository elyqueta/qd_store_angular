export interface AdminCreateProductInput {
  categoryId: string;
  name: string;
  image?: File;
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

export interface AdminUpdateProductImageInput {
  displayOrder?: number;
}

export interface AdminUploadProductImageMetadata {
  displayOrder?: number;
  width?: number;
  height?: number;
  format?: string;
  sizeBytes?: number;
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
