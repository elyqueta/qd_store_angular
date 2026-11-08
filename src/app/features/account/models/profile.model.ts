import { AuthUser } from '../../../core/auth/auth.models';

export interface ProfilePhoto {
  url: string;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

export type UserProfile = AuthUser & {
  profilePhoto: ProfilePhoto | null;
};

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
  removePhoto?: boolean;
  photo?: File;
}
