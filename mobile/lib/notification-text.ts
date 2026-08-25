import type { Notification } from '@/types';

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function getNotificationText(notification: Notification, t: Translate) {
  const { title, message } = notification;
  const lowerTitle = title.toLowerCase();
  const titleKey = title === 'New Deposit Submitted'
    ? 'notificationContent.newDepositTitle'
    : title === 'Withdrawal Request'
      ? 'notificationContent.withdrawalRequestTitle'
      : lowerTitle.includes('deposit')
        ? 'notificationContent.depositConfirmedTitle'
        : lowerTitle.includes('withdrawal')
          ? lowerTitle.includes('rejected')
            ? 'notificationContent.withdrawalRejectedTitle'
            : 'notificationContent.withdrawalConfirmedTitle'
          : null;
  const amount = message.match(/([\d,]+) BIF/)?.[1] ?? '';
  const bank = message.match(/BIF to ([A-Za-z]+)|to ([A-Za-z]+) —/)?.[1] ?? '';
  const reason = message.split('Reason:')[1]?.trim() ?? '';
  let translatedMessage = message;

  if (lowerTitle.includes('deposit') && message.includes('investment is now active')) {
    translatedMessage = t('notificationContent.depositConfirmedMessage', { amount });
  } else if (lowerTitle.includes('withdrawal') && lowerTitle.includes('rejected')) {
    translatedMessage = t('notificationContent.withdrawalRejectedMessage', { amount, reason });
  } else if (lowerTitle.includes('withdrawal') && message.includes('has been confirmed')) {
    translatedMessage = t('notificationContent.withdrawalConfirmedMessage', { amount, bank });
  } else if (title === 'New Deposit Submitted') {
    const match = message.match(/^(.+) submitted a deposit of ([\d,]+) BIF \((.+)\)/);
    if (match) translatedMessage = t('notificationContent.newDepositMessage', { name: match[1], amount: match[2], period: match[3] });
  } else if (title === 'Withdrawal Request') {
    const match = message.match(/^(.+) requested a withdrawal of ([\d,]+) BIF to (.+) —/);
    if (match) translatedMessage = t('notificationContent.withdrawalRequestMessage', { name: match[1], amount: match[2], bank: match[3] });
  }

  return { title: titleKey ? t(titleKey) : title, message: translatedMessage };
}