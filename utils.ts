
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Chưa thiết lập';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
