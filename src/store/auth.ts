/**
 * MoonLander Pure Email Authentication & Cloud Sync Store
 * 
 * Supports:
 * - Passwordless email magic link (signInWithOtp)
 * - Email & Password authentication (signInWithPassword, signUp)
 * - 100% offline Guest Mode fallback when unconfigured
 * - Callsign selection & validation
 * - Local guest data import into cloud profile
 * - Account deletion cascade
 * - Zero OAuth providers (no Google, no GitHub)
 */

import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  SupabaseProfileRepository,
  OfflineWriteQueue,
  importGuestDataToCloud,
  deleteUserAccountData,
} from "@/lib/repository/supabaseRepository";
import { validateCallsign } from "@/lib/auth/callsign";
import { useProfileStore } from "./profile";

export interface AuthState {
  user: User | null;
  session: Session | null;
  isConfigured: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  authModalOpen: boolean;
  offlineQueueCount: number;
  error: string | null;
  infoMessage: string | null;

  // Actions
  initialize: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearMessages: () => void;

  // Pure Email Authentication
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
    callsign: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  // Data Management
  updateCallsign: (callsign: string) => Promise<{ success: boolean; error?: string }>;
  importGuestData: () => Promise<{ success: boolean; error?: string; count?: number }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshQueueCount: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isConfigured: isSupabaseConfigured(),
  isLoading: false,
  isSyncing: false,
  authModalOpen: false,
  offlineQueueCount: 0,
  error: null,
  infoMessage: null,

  initialize: async () => {
    get().refreshQueueCount();

    if (!isSupabaseConfigured()) {
      set({ isConfigured: false, isLoading: false });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      set({ isConfigured: false, isLoading: false });
      return;
    }

    set({ isLoading: true });

    try {
      // 1. Restore active session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ user: session.user, session });

        // Flush offline write queue
        await OfflineWriteQueue.flush(supabase);
        get().refreshQueueCount();

        // Sync cloud profile to local store
        const profileRepo = new SupabaseProfileRepository();
        const profile = await profileRepo.getProfile();
        useProfileStore.setState({ profile });
      }

      // 2. Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        set({ user: newSession?.user || null, session: newSession });
        if (newSession?.user) {
          await OfflineWriteQueue.flush(supabase);
          get().refreshQueueCount();
          const profileRepo = new SupabaseProfileRepository();
          const profile = await profileRepo.getProfile();
          useProfileStore.setState({ profile });
        }
      });
    } catch (err) {
      console.warn("[useAuthStore] Init warning:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  openAuthModal: () => set({ authModalOpen: true, error: null, infoMessage: null }),
  closeAuthModal: () => set({ authModalOpen: false, error: null, infoMessage: null }),
  clearMessages: () => set({ error: null, infoMessage: null }),
  refreshQueueCount: () => set({ offlineQueueCount: OfflineWriteQueue.getQueueLength() }),

  signInWithMagicLink: async (email: string) => {
    set({ isLoading: true, error: null, infoMessage: null });
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      const err = "Cloud services unavailable. Operating in local guest mode.";
      set({ error: err, isLoading: false });
      return { success: false, error: err };
    }

    try {
      const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      const msg = "Secure sign-in dispatch sent. Check your email for the magic access link.";
      set({ infoMessage: msg, isLoading: false });
      return { success: true };
    } catch (err) {
      const errStr = err instanceof Error ? err.message : String(err);
      set({ error: errStr, isLoading: false });
      return { success: false, error: errStr };
    }
  },

  signInWithPassword: async (email: string, password: string) => {
    set({ isLoading: true, error: null, infoMessage: null });
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      const err = "Cloud services unavailable. Operating in local guest mode.";
      set({ error: err, isLoading: false });
      return { success: false, error: err };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
        authModalOpen: false,
      });

      // Sync profile
      const profileRepo = new SupabaseProfileRepository();
      const profile = await profileRepo.getProfile();
      useProfileStore.setState({ profile });

      return { success: true };
    } catch (err) {
      const errStr = err instanceof Error ? err.message : String(err);
      set({ error: errStr, isLoading: false });
      return { success: false, error: errStr };
    }
  },

  signUpWithPassword: async (email: string, password: string, callsign: string) => {
    set({ isLoading: true, error: null, infoMessage: null });

    const validation = validateCallsign(callsign);
    if (!validation.isValid) {
      set({ error: validation.error || "Invalid callsign format.", isLoading: false });
      return { success: false, error: validation.error };
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      const err = "Cloud services unavailable. Operating in local guest mode.";
      set({ error: err, isLoading: false });
      return { success: false, error: err };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            callsign: callsign.trim(),
          },
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
        infoMessage: "Account created successfully. You may now sign in.",
      });

      return { success: true };
    } catch (err) {
      const errStr = err instanceof Error ? err.message : String(err);
      set({ error: errStr, isLoading: false });
      return { success: false, error: errStr };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ user: null, session: null, isLoading: false, authModalOpen: false });
  },

  updateCallsign: async (callsign: string) => {
    const validation = validateCallsign(callsign);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const currentProfile = useProfileStore.getState().profile;
    const updated = {
      ...currentProfile,
      callsign: callsign.trim(),
      updatedAt: new Date().toISOString(),
    };

    useProfileStore.setState({ profile: updated });

    const profileRepo = new SupabaseProfileRepository();
    await profileRepo.saveProfile(updated);

    return { success: true };
  },

  importGuestData: async () => {
    set({ isSyncing: true, error: null });
    try {
      const result = await importGuestDataToCloud();
      useProfileStore.setState({ profile: result.mergedProfile });
      set({
        isSyncing: false,
        infoMessage: `Import complete: ${result.importedMissions} missions, ${result.importedHistory} flight records synchronized.`,
      });
      return {
        success: true,
        count: result.importedMissions + result.importedHistory,
      };
    } catch (err) {
      const errStr = err instanceof Error ? err.message : String(err);
      set({ isSyncing: false, error: errStr });
      return { success: false, error: errStr };
    }
  },

  deleteAccount: async () => {
    set({ isLoading: true });
    const success = await deleteUserAccountData();
    if (success) {
      set({
        user: null,
        session: null,
        isLoading: false,
        authModalOpen: false,
        infoMessage: "All profile and cloud flight telemetry permanently deleted.",
      });
      return { success: true };
    } else {
      const err = "Failed to complete account deletion cascade.";
      set({ error: err, isLoading: false });
      return { success: false, error: err };
    }
  },
}));
