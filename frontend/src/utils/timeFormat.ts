export const formatTime12Hour = (time24: string): string => {
  if (!time24) return '';

  const [hours24, minutes] = time24.split(':').map(Number);

  if (isNaN(hours24) || isNaN(minutes)) return time24;

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};
