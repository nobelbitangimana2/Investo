"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Lock } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { getClientProfile, updateClientProfile } from "@/lib/mock-api";
import { profileSchema, type ProfileFormValues } from "@/lib/zod-schemas";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { getInitials } from "@/lib/utils";
import type { ClientProfile } from "@/types";

const BANKS = ["Bancobu", "BCB", "KCB", "Ecobank"];

export default function ClientSettingsPage() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [profile, setProfile] = useState<ClientProfile | null>(null);

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
          phone: p.phone,
          address: p.address,
          city: p.city,
          province: p.province,
          bankName: p.bankName,
          accountNumber: p.accountNumber,
          accountHolderName: p.accountHolderName,
        });
      }
    });
  }, [user, reset]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    await updateClientProfile(user.id, data);
    toast.success("Profile updated successfully.");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile Picture */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile Picture</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-navy-700 text-white flex items-center justify-center text-xl font-bold">
              {getInitials(user?.name ?? "U")}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">Profile picture upload coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" error={errors.firstName?.message} {...register("firstName")} />
              <Input label="Last Name" error={errors.lastName?.message} {...register("lastName")} />
            </div>
            <Input label="Phone Number" placeholder="+257 79 000 000" error={errors.phone?.message} {...register("phone")} />
            <Input label="Address" error={errors.address?.message} {...register("address")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="City" error={errors.city?.message} {...register("city")} />
              <Input label="Province" error={errors.province?.message} {...register("province")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bank Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Controller
              name="bankName"
              control={control}
              render={({ field }) => (
                <Select
                  label="Bank"
                  placeholder="Select bank"
                  options={BANKS.map((b) => ({ value: b, label: b }))}
                  error={errors.bankName?.message}
                  {...field}
                />
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Account Number" error={errors.accountNumber?.message} {...register("accountNumber")} />
              <Input label="Account Holder Name" error={errors.accountHolderName?.message} {...register("accountHolderName")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Change Password */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Current Password" type="password" placeholder="••••••••" />
          <Input label="New Password" type="password" placeholder="••••••••" />
          <Input label="Confirm New Password" type="password" placeholder="••••••••" />
          <div className="flex justify-end">
            <Button variant="outline" type="button" onClick={() => toast.info("Password change is simulated in this demo.")}>
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
