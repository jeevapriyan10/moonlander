"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/auth";
import { useProfileStore } from "@/store/profile";
import { validateCallsign } from "@/lib/auth/callsign";
import {
  Mail,
  KeyRound,
  ShieldCheck,
  Cloud,
  CloudOff,
  LogOut,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Radio,
} from "lucide-react";

export const AuthModal: React.FC = () => {
  const {
    user,
    isConfigured,
    isLoading,
    isSyncing,
    authModalOpen,
    offlineQueueCount,
    error,
    infoMessage,
    closeAuthModal,
    clearMessages,
    signInWithMagicLink,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    updateCallsign,
    importGuestData,
    deleteAccount,
  } = useAuthStore();

  const { profile } = useProfileStore();

  const [authMethod, setAuthMethod] = useState<"magic" | "password">("magic");
  const [passwordMode, setPasswordMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newCallsign, setNewCallsign] = useState("");
  const [editingCallsign, setEditingCallsign] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Callsign validation for sign up
  const callsignValidation = React.useMemo<{ isValid: boolean; valid: boolean; error?: string }>(() => {
    if (!newCallsign && passwordMode === "signin") return { isValid: true, valid: true };
    return validateCallsign(newCallsign);
  }, [newCallsign, passwordMode]);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await signInWithMagicLink(email);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (passwordMode === "signup") {
      if (!callsignValidation.isValid) return;
      await signUpWithPassword(email, password, newCallsign || "Cadet");
    } else {
      await signInWithPassword(email, password);
    }
  };

  const handleSaveCallsign = async () => {
    if (!newCallsign) return;
    const res = await updateCallsign(newCallsign);
    if (res.success) {
      setEditingCallsign(false);
      setNewCallsign("");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteAccount();
    setConfirmDelete(false);
  };

  return (
    <Modal
      isOpen={authModalOpen}
      onClose={() => {
        clearMessages();
        closeAuthModal();
      }}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-telemetry-cyan animate-pulse" />
          <span className="font-heading font-black tracking-wider uppercase text-white">
            {user ? "Pilot Telemetry // Cloud Profile" : "Meridian Ground Link // Authentication"}
          </span>
        </div>
      }
      subtitle={
        <span className="font-mono text-xs text-slate-400">
          {user
            ? "Manage cross-device synchronized telemetry and flight records."
            : "Sign in with your email to sync flight achievements and rank across devices."}
        </span>
      }
    >
      <div className="space-y-5 text-sm">
        {/* Error / Info Alerts */}
        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 flex items-start gap-2 text-xs font-mono text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-2 text-xs font-mono text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* AUTHENTICATED STATE */}
        {user ? (
          <div className="space-y-4">
            {/* Profile Overview Card */}
            <div className="p-4 rounded-xl bg-space-surface border border-space-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">ACTIVE CALLSIGN</span>
                  {editingCallsign ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={newCallsign}
                        onChange={(e) => setNewCallsign(e.target.value)}
                        placeholder="New callsign (3-20 chars)"
                        className="bg-black/60 border border-telemetry-cyan text-white px-2 py-1 rounded text-xs font-mono focus:outline-none"
                      />
                      <Button size="sm" variant="primary" onClick={handleSaveCallsign}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCallsign(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-heading font-bold text-lg text-white tracking-wide">
                        {profile.callsign}
                      </span>
                      <button
                        onClick={() => {
                          setNewCallsign(profile.callsign);
                          setEditingCallsign(true);
                        }}
                        className="text-[11px] font-mono text-telemetry-cyan hover:underline"
                      >
                        [Edit]
                      </button>
                    </div>
                  )}
                </div>
                <Badge variant="nominal" size="sm" className="flex items-center gap-1 font-mono">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>SYNCHRONIZED</span>
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-space-border/60 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">CONNECTED ACCOUNT</span>
                  <span className="text-white truncate block">{user.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PILOT RANK & XP</span>
                  <span className="text-telemetry-amber font-bold">
                    {profile.currentRank} ({profile.xp} XP)
                  </span>
                </div>
              </div>

              {offlineQueueCount > 0 && (
                <div className="pt-2 border-t border-space-border/60 flex items-center justify-between text-[11px] font-mono text-telemetry-amber">
                  <span>Pending Offline Actions:</span>
                  <span className="font-bold">{offlineQueueCount} queued</span>
                </div>
              )}
            </div>

            {/* Cloud Actions */}
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="md"
                className="w-full flex items-center justify-center gap-2 font-mono text-xs"
                onClick={importGuestData}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-telemetry-cyan" />
                )}
                <span>Import Local Guest Telemetry to Cloud</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full flex items-center justify-center gap-2 font-mono text-xs"
                onClick={signOut}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect & Switch to Guest Mode</span>
              </Button>
            </div>

            {/* Danger Zone: Account Deletion */}
            <div className="pt-3 border-t border-red-950/80">
              {confirmDelete ? (
                <div className="p-3 rounded-lg bg-red-950/70 border border-red-600 space-y-2">
                  <p className="text-xs font-mono text-red-200">
                    Are you sure? This will permanently delete your cloud profile, mission saves, and leaderboard high scores.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                    >
                      Yes, Permanently Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account & Cloud Telemetry</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* UNAUTHENTICATED STATE */
          <div className="space-y-4">
            {!isConfigured && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-300 flex items-start gap-2">
                <CloudOff className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Offline Guest Mode Active</span>
                  <span>
                    Supabase credentials are not configured in this environment. All flights and achievements are saved locally in your browser.
                  </span>
                </div>
              </div>
            )}

            {/* Pure Email Auth Method Tabs */}
            <div className="flex rounded-lg bg-space-surface border border-space-border p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("magic");
                  clearMessages();
                }}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-mono transition-colors flex items-center justify-center gap-1.5 ${
                  authMethod === "magic"
                    ? "bg-telemetry-cyan/20 text-telemetry-cyan font-bold border border-telemetry-cyan/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Passwordless Magic Link</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("password");
                  clearMessages();
                }}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-mono transition-colors flex items-center justify-center gap-1.5 ${
                  authMethod === "password"
                    ? "bg-telemetry-cyan/20 text-telemetry-cyan font-bold border border-telemetry-cyan/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Email & Password</span>
              </button>
            </div>

            {/* TAB 1: MAGIC LINK */}
            {authMethod === "magic" && (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                    Pilot Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="commander@meridian-station.org"
                    className="w-full bg-space-bg border border-space-border focus:border-telemetry-cyan rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-space-border/60 text-[11px] font-mono text-slate-400 leading-relaxed">
                  We will transmit a secure, one-time cryptographic sign-in link directly to your inbox. No passwords or third-party OAuth trackers required.
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full flex items-center justify-center gap-2 font-mono text-xs"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  <span>Transmit Magic Sign-In Link</span>
                </Button>
              </form>
            )}

            {/* TAB 2: EMAIL & PASSWORD */}
            {authMethod === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">AUTHENTICATION ROUTE</span>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setPasswordMode("signin")}
                      className={`hover:underline ${
                        passwordMode === "signin" ? "text-telemetry-cyan font-bold" : "text-slate-400"
                      }`}
                    >
                      Sign In
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setPasswordMode("signup")}
                      className={`hover:underline ${
                        passwordMode === "signup" ? "text-telemetry-cyan font-bold" : "text-slate-400"
                      }`}
                    >
                      Enlist (Sign Up)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                    Pilot Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pilot@moonlander.dev"
                    className="w-full bg-space-bg border border-space-border focus:border-telemetry-cyan rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                    Passkey / Secret Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-space-bg border border-space-border focus:border-telemetry-cyan rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                {passwordMode === "signup" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-300 uppercase">
                        Desired Pilot Callsign
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {newCallsign.length}/20 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={newCallsign}
                      onChange={(e) => setNewCallsign(e.target.value)}
                      placeholder="e.g. Valkyrie-7"
                      className={`w-full bg-space-bg border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none ${
                        newCallsign && !callsignValidation.isValid
                          ? "border-red-500"
                          : "border-space-border focus:border-telemetry-cyan"
                      }`}
                    />
                    {newCallsign && !callsignValidation.isValid && (
                      <span className="text-[10px] font-mono text-red-400 block mt-1">
                        {callsignValidation.error}
                      </span>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full flex items-center justify-center gap-2 font-mono text-xs"
                  disabled={isLoading || !email || !password || (passwordMode === "signup" && !callsignValidation.isValid)}
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : passwordMode === "signup" ? (
                    <UserCheck className="w-3.5 h-3.5" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5" />
                  )}
                  <span>{passwordMode === "signup" ? "Enlist & Synchronize Profile" : "Authorize Flight Access"}</span>
                </Button>
              </form>
            )}

            {/* Privacy & Guest Guarantee */}
            <div className="pt-2 border-t border-space-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-telemetry-green" />
                <span>Zero third-party OAuth tracking</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  closeAuthModal();
                }}
                className="font-mono text-[11px] text-telemetry-cyan hover:underline"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
