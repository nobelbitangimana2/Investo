import type { Notification } from "@/types";

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function getNotificationText(notification: Notification, t: Translate) {
  const { title, message } = notification;
  const titleKey = title === "New Deposit Submitted"
    ? "newDepositTitle"
    : title === "Withdrawal Request"
      ? "withdrawalRequestTitle"
      : title.toLowerCase().includes("deposit")
        ? "depositConfirmedTitle"
        : title.toLowerCase().includes("withdrawal")
          ? title.toLowerCase().includes("rejected") ? "withdrawalRejectedTitle" : "withdrawalConfirmedTitle"
          : null;

  let translatedMessage = message;
  const amount = message.match(/([\d,]+) BIF/)?.[1] ?? "";
  const bank = message.match(/BIF to ([A-Za-z]+)|to ([A-Za-z]+) —/)?.[1] ?? "";
  const reason = message.split("Reason:")[1]?.trim() ?? message.split("Raison :")[1]?.trim() ?? "";

  if (title.toLowerCase().includes("deposit") && message.includes("investment is now active")) {
    translatedMessage = t("depositConfirmedMessage", { amount });
  } else if (title.toLowerCase().includes("withdrawal") && title.toLowerCase().includes("rejected")) {
    translatedMessage = t("withdrawalRejectedMessage", { amount, reason });
  } else if (title.toLowerCase().includes("withdrawal") && message.includes("has been confirmed")) {
    translatedMessage = t("withdrawalConfirmedMessage", { amount, bank });
  } else if (title === "New Deposit Submitted") {
    const match = message.match(/^(.+) submitted a deposit of ([\d,]+) BIF \((.+)\)/);
    translatedMessage = match ? t("newDepositMessage", { name: match[1], amount: match[2], period: match[3] }) : message;
  } else if (title === "Withdrawal Request") {
    const match = message.match(/^(.+) requested a withdrawal of ([\d,]+) BIF to (.+) —/);
    translatedMessage = match ? t("withdrawalRequestMessage", { name: match[1], amount: match[2], bank: match[3] }) : message;
  } else if (message.includes("'s deposit of") && message.endsWith("was confirmed.")) {
    const match = message.match(/^(.+)'s deposit of ([\d,]+) BIF was confirmed\./);
    translatedMessage = match ? t("staffDepositConfirmedMessage", { name: match[1], amount: match[2] }) : message;
  } else if (message.includes("'s withdrawal of") && message.endsWith("was confirmed.")) {
    const match = message.match(/^(.+)'s withdrawal of ([\d,]+) BIF was confirmed\./);
    translatedMessage = match ? t("staffWithdrawalConfirmedMessage", { name: match[1], amount: match[2] }) : message;
  }

  return {
    title: titleKey ? t(titleKey) : title,
    message: translatedMessage,
  };
}