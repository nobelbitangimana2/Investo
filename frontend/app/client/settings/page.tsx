"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Lock, Camera, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/auth-store";
import { getClientProfile, updateClientProfile, changePassword, uploadAvatar } from "@/lib/mock-api";
import { profileSchema, type ProfileFormValues } from "@/lib/zod-schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { getInitials } from "@/lib/utils";
import type { ClientProfile } from "@/types";

export default function ClientSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const t = useTranslations("client.settings");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password form state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (!user) return;
    getClientProfile(user.id).then((p) => {
      if (p) {
        setProfile(p);
        reset({
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone ?? "",
          address: p.address ?? "",
          city: p.city ?? "",
          province: p.province ?? "",
          bankName: p.bankName ?? undefined,
          accountNumber: p.accountNumber ?? "",
          accountHolderName: p.accountHolderName ?? "",
        });
      }
    });
  }, [user, reset]);

  // ── Avatar upload ──────────────────────────────────────────────────
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

  // ── Profile save ───────────────────────────────────────────────────
  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    await updateClientProfile(user.id, data);
    toast.success(t("profileSuccess"));
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
    } catch (err) { setPwError(err instanceof Error ? err.message : t("pwNoMatch")); }
    finally { setPwLoading(false); }
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
                  {getInitials(user?.name ?? "U")}
                </div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={t("changePhoto")}>
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                className="mt-2 text-xs font-medium text-navy-600 hover:underline disabled:opacity-50">
                {avatarUploading ? "…" : t("changePhoto")}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader><CardTitle>{t("personalInfo")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t("firstName")} error={errors.firstName?.message} {...register("firstName")} />
              <Input label={t("lastName")} error={errors.lastName?.message} {...register("lastName")} />
            </div>
            <Input label={t("phone")} placeholder={t("phonePlaceholder")} error={errors.phone?.message} {...register("phone")} />
            <Input label={t("address")} error={errors.address?.message} {...register("address")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t("city")} error={errors.city?.message} {...register("city")} />
              <Input label={t("province")} error={errors.province?.message} {...register("province")} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>{tCommon("save")}</Button>
        </div>
      </form>

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
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Input label={t("newPassword")} type={showNew ? "text" : "password"} placeholder={t("newPasswordPlaceholder")}
              value={newPw} onChange={(e) => setNewPw(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Input label={t("confirmNewPassword")} type={showConfirm ? "text" : "password"} placeholder={t("confirmNewPasswordPlaceholder")}
              value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwError}</p>}
          <div className="flex justify-end">
            <Button type="button" loading={pwLoading} disabled={!currentPw || !newPw || !confirmPw} onClick={handlePasswordChange}>
              {t("updatePassword")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
