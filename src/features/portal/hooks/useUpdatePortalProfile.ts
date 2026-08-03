import { useMutation } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import type { AuthUser } from '../../../hooks/useAuth';

export interface UpdatePortalProfileInput {
  operatorName?: string;
  password?: string;
}

export interface UpdatePortalProfileResponse {
  token: string;
  user: AuthUser;
}

// PUT /portal/profile — no `username` field: the backend always passes
// isGlobalAdmin: false for this route, so a username change is rejected.
// On success the caller must call useAuth().login(data.token, data.user) to
// refresh the stored session (mirrors src/pages/core/ProfileUser.tsx).
export const useUpdatePortalProfile = () => {
  return useMutation<UpdatePortalProfileResponse, unknown, UpdatePortalProfileInput>({
    mutationFn: async (data) => {
      const response = await apiClient.put<UpdatePortalProfileResponse>('/portal/profile', data);
      return response.data;
    },
  });
};
