export type QuoteRequestStatus = 'new' | 'contacted' | 'closed';

export interface QuoteRequest {
  id: string;
  companyName: string;
  nif: string;
  contactName: string;
  email: string;
  phone: string;
  province: string;
  municipality: string;
  sector: string;
  volume: string;
  categories: string[];
  message: string | null;
  status: QuoteRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteRequestInput {
  companyName: string;
  nif: string;
  contactName: string;
  email: string;
  phone: string;
  province: string;
  municipality: string;
  sector: string;
  volume: string;
  categories: string[];
  message?: string | null;
}

export interface QuoteRequestPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface QuoteRequestListPage {
  items: QuoteRequest[];
  pagination: QuoteRequestPagination;
}

export interface ListQuoteRequestsParams {
  page: number;
  limit: number;
  search?: string;
  status?: QuoteRequestStatus;
}

export interface UpdateQuoteRequestStatusInput {
  status: QuoteRequestStatus;
}
