export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

export interface ProductCategory {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  displayOrder: number;
  width: number | null;
  height: number | null;
  format: string | null;
  sizeBytes: number | null;
}

export interface ProductSpecification {
  id: string;
  productId: string;
  specKey: string;
  specValue: string;
  displayOrder: number;
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListPage {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductDetail extends Product {
  images: ProductImage[];
  specifications: ProductSpecification[];
}

export interface ApiCollectionResponse<T> {
  status: 'success';
  data: T[];
  pagination: ProductPagination;
}

export interface ApiSingleResponse<T> {
  status: 'success';
  data: T;
}
