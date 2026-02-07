/**
 * useUserProfile Hook
 * Manages user profile data and preferences
 */

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  userId: string;
  companyId: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  dateOfBirth?: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  preferences?: {
    notificationsEnabled: boolean;
    emailAlerts: boolean;
    smsAlerts?: boolean;
    breakReminders?: boolean;
    shiftReminders?: boolean;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  dateOfBirth?: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  preferences?: Partial<UserProfile['preferences']>;
}

export function useUserProfile(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const actualUserId = userId || user?.id;

  // Fetch user profile
  const { data: profile, isLoading, isFetching } = useQuery({
    queryKey: ['user-profile', actualUserId],
    queryFn: async () => {
      if (!actualUserId) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', actualUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        companyId: data.company_id,
        firstName: data.first_name,
        lastName: data.last_name,
        phoneNumber: data.phone_number,
        profilePhotoUrl: data.profile_photo_url,
        dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
        emergencyContactName: data.emergency_contact_name,
        emergencyContactPhone: data.emergency_contact_phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postal_code,
        country: data.country,
        notes: data.notes,
        preferences: data.preferences || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } as UserProfile;
    },
    enabled: !!actualUserId,
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (data: { companyId: string } & ProfileUpdateData) => {
      if (!actualUserId) {
        throw new Error('User ID required');
      }

      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: actualUserId,
          company_id: data.companyId,
          first_name: data.firstName,
          last_name: data.lastName,
          phone_number: data.phoneNumber,
          profile_photo_url: data.profilePhotoUrl,
          date_of_birth: data.dateOfBirth?.toISOString(),
          emergency_contact_name: data.emergencyContactName,
          emergency_contact_phone: data.emergencyContactPhone,
          address: data.address,
          city: data.city,
          state: data.state,
          postal_code: data.postalCode,
          country: data.country,
          notes: data.notes,
          preferences: data.preferences,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: newProfile.id,
        userId: newProfile.user_id,
        companyId: newProfile.company_id,
        firstName: newProfile.first_name,
        lastName: newProfile.last_name,
        phoneNumber: newProfile.phone_number,
        profilePhotoUrl: newProfile.profile_photo_url,
        dateOfBirth: newProfile.date_of_birth ? new Date(newProfile.date_of_birth) : undefined,
        emergencyContactName: newProfile.emergency_contact_name,
        emergencyContactPhone: newProfile.emergency_contact_phone,
        address: newProfile.address,
        city: newProfile.city,
        state: newProfile.state,
        postalCode: newProfile.postal_code,
        country: newProfile.country,
        notes: newProfile.notes,
        preferences: newProfile.preferences,
        createdAt: new Date(newProfile.created_at),
        updatedAt: new Date(newProfile.updated_at),
      } as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', actualUserId] });
      setError(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to create profile';
      setError(message);
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updateData: ProfileUpdateData) => {
      if (!profile?.id) {
        throw new Error('Profile ID required');
      }

      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update({
          first_name: updateData.firstName,
          last_name: updateData.lastName,
          phone_number: updateData.phoneNumber,
          profile_photo_url: updateData.profilePhotoUrl,
          date_of_birth: updateData.dateOfBirth?.toISOString(),
          emergency_contact_name: updateData.emergencyContactName,
          emergency_contact_phone: updateData.emergencyContactPhone,
          address: updateData.address,
          city: updateData.city,
          state: updateData.state,
          postal_code: updateData.postalCode,
          country: updateData.country,
          notes: updateData.notes,
          preferences: updateData.preferences
            ? { ...profile.preferences, ...updateData.preferences }
            : profile.preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: updatedProfile.id,
        userId: updatedProfile.user_id,
        companyId: updatedProfile.company_id,
        firstName: updatedProfile.first_name,
        lastName: updatedProfile.last_name,
        phoneNumber: updatedProfile.phone_number,
        profilePhotoUrl: updatedProfile.profile_photo_url,
        dateOfBirth: updatedProfile.date_of_birth
          ? new Date(updatedProfile.date_of_birth)
          : undefined,
        emergencyContactName: updatedProfile.emergency_contact_name,
        emergencyContactPhone: updatedProfile.emergency_contact_phone,
        address: updatedProfile.address,
        city: updatedProfile.city,
        state: updatedProfile.state,
        postalCode: updatedProfile.postal_code,
        country: updatedProfile.country,
        notes: updatedProfile.notes,
        preferences: updatedProfile.preferences,
        createdAt: new Date(updatedProfile.created_at),
        updatedAt: new Date(updatedProfile.updated_at),
      } as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', actualUserId] });
      setError(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<UserProfile['preferences']>) => {
      if (!profile?.id) {
        throw new Error('Profile ID required');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          preferences: { ...profile.preferences, ...preferences },
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', actualUserId] });
      setError(null);
    },
  });

  return {
    profile,
    isLoading,
    isFetching,
    error,
    createProfile: (data: { companyId: string } & ProfileUpdateData) =>
      createProfileMutation.mutate(data),
    updateProfile: (data: ProfileUpdateData) => updateProfileMutation.mutate(data),
    updatePreferences: (preferences: Partial<UserProfile['preferences']>) =>
      updatePreferencesMutation.mutate(preferences),
    isCreatingProfile: createProfileMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
  };
}

export default useUserProfile;
