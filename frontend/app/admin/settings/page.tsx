"use client";

import { useRef, useState } from "react";
import { User, Lock, Eye, EyeOff, Camera } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { changePassword, uploadAvatar } from "@/lib/mock-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { getInitials } from "@/lib/utils";

export default function AdminSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const res = await uploadAvatar(file);
      updateUser({ profilePicture: res.profilePicture });
      toast.success("Profile picture updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handlePasswordChange() {
    setPwError(null);
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      toast.success("Password updated successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  }

  const currentAvatar = avatarPreview ?? user?.profilePicture;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="relative group">
              {currentAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentAvatar}
                  alt={user?.name}
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-navy-700 text-white flex items-center justify-center text-2xl font-bold">
                  {getInitials(user?.name ?? "A")}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{user?.role}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="mt-2 text-xs font-medium text-navy-600 hover:underline disabled:opacity-50"
              >
                {avatarUploading ? "Uploading…" : "Change photo"}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input label="Current Password" type={showCurrent ? "text" : "password"} placeholder="••••••••"
              value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Input label="New Password" type={showNew ? "text" : "password"} placeholder="At least 8 characters"
              value={newPw} onChange={(e) => setNewPw(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Input label="Confirm New Password" type={showConfirm ? "text" : "password"} placeholder="Repeat new password"
              value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwError}</p>
          )}
          <div className="flex justify-end">
            <Button type="button" loading={pwLoading} disabled={!currentPw || !newPw || !confirmPw} onClick={handlePasswordChange}>
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
