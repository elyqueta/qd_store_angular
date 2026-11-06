export interface CreateAdminCategoryInput {
  label: string;
  icon?: string;
}

export interface UpdateAdminCategoryInput {
  label?: string;
  icon?: string | null;
}
