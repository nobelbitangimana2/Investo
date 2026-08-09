"use client";

import { useEffect, useRef, useState } from "react";
import { User, Lock, Eye, EyeOff, Camera, Info, MapPin } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  changePassword,
  uploadAvatar,
  getMyUserProfile,
  updateContactInfo,
} from "@/lib/mock-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { getInitials } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function AccountantSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const t = useTranslations("accountant.settings");
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Contact info
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactDirty, setContactDirty] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyUserProfile().then((p) => {
      setPhone(p.phone ?? "");
      setAddress(p.address ?? "");
      setCity(p.city ?? "");
      setProvince(p.province ?? "");
    }).catch(() => {/* non-critical */});
  }, [user]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const res = await uploadAvatar(file);
      updateUser({ profilePicture: res.profilePicture });
      toast.success(t("avatarSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleContactSave() {
    setContactLoading(true);
    try {
      await updateContactInfo({ phone, address, city, province });
      toast.success(t("contactSaved"));
      setContactDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setContactLoading(false);
    }
  }

  async function handlePasswordChange() {
    setPwError(null);
    if (newPw.length < 8) { setPwError(t("pwMin8")); return; }
    if (newPw !== confirmPw) { setPwError(t("pwNoMatch")); return; }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      toast.success(t("pwSuccess"));
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
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> {t("profilePicture")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="relative group">
              {currentAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentAvatar} alt={user?.name}
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-navy-700 text-white flex items-center justify-center text-2xl font-bold">
                  {getInitials(user?.name ?? "AC")}
                </div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{user?.role}</p>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="mt-2 text-xs font-medium text-navy-600 hover:underline disabled:opacity-50">
                {avatarUploading ? "Uploading…" : t("changePhoto")}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </CardContent>
      </Card>

      {/* Account Info — read-only name + email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> {t("accountInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-2.5 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              {t("managedByAdmin")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t("fullName")}</p>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                {user?.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t("emailAddress")}</p>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                {user?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info — editable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> {t("contactInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={t("phone")}
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setContactDirty(true); }}
          />
          <Input
            label={t("address")}
            placeholder={t("addressPlaceholder")}
            value={address}
            onChange={(e) => { setAddress(e.target.value); setContactDirty(true); }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("city")}
              placeholder={t("cityPlaceholder")}
              value={city}
              onChange={(e) => { setCity(e.target.value); setContactDirty(true); }}
            />
            <Input
              label={t("province")}
              placeholder={t("provincePlaceholder")}
              value={province}
              onChange={(e) => { setProvince(e.target.value); setContactDirty(true); }}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              loading={contactLoading}
              disabled={!contactDirty}
              onClick={handleContactSave}
            >
              {t("saveContactInfo")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> {t("changePassword")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input label={t("currentPassword")} type={showCurrent ? "text" : "password"} placeholder="••••••••"
              value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Input label={t("newPassword")} type={showNew ? "text" : "password"} placeholder={t("newPasswordPlaceholder")}
              value={newPw} onChange={(e) => setNewPw(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Input label={t("confirmNewPassword")} type={showConfirm ? "text" : "password"} placeholder={t("confirmNewPasswordPlaceholder")}
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
            <Button type="button" loading={pwLoading}
              disabled={!currentPw || !newPw || !confirmPw} onClick={handlePasswordChange}>
              {t("updatePassword")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
