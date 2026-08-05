"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, XCircle } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { rejectSchema, type RejectFormValues } from "@/lib/zod-schemas";

interface ConfirmRejectModalProps {
  open: boolean;
  onClose: () => void;
  action: "confirm" | "reject";
  targetLabel: string;
  onConfirm: (note?: string) => Promise<void>;
}

export function ConfirmRejectModal({
  open,
  onClose,
  action,
  targetLabel,
  onConfirm,
}: ConfirmRejectModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormValues>({
    resolver: action === "reject" ? zodResolver(rejectSchema) : undefined,
  });

  async function onSubmit(data: RejectFormValues) {
    setLoading(true);
    try {
      await onConfirm(action === "reject" ? data.rejectionNote : undefined);
      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const isReject = action === "reject";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReject ? "Reject Transaction" : "Confirm Transaction"}
      description={
        isReject
          ? `You are about to reject ${targetLabel}. This action requires a reason.`
          : `You are about to confirm ${targetLabel}. This action cannot be undone.`
      }
    >
      {isReject ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textarea
            label="Rejection Reason"
            placeholder="Explain why this transaction is being rejected..."
            rows={4}
            error={errors.rejectionNote?.message}
            {...register("rejectionNote")}
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" loading={loading}>
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please confirm that you want to approve this transaction.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="success" loading={loading} onClick={handleConfirm}>
              <CheckCircle className="h-4 w-4" />
              Confirm
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
