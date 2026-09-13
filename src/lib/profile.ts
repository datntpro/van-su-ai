export type UserProfile = {
  birthDate: string; // YYYY-MM-DD required
  birthTime?: string; // HH:mm optional
  birthPlace?: string;
  displayName?: string;
  createdAt: string;
};

export function zodiacFromBirthDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();
  // Western sun sign labels in Vietnamese (entertainment)
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Bạch Dương';
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Kim Ngưu';
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Song Tử';
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Cự Giải';
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Sư Tử';
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Xử Nữ';
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Thiên Bình';
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Bọ Cạp';
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Nhân Mã';
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return 'Ma Kết';
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Bảo Bình';
  return 'Song Ngư';
}

export function yearAnimal(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const animals = [
    'Tý',
    'Sửu',
    'Dần',
    'Mão',
    'Thìn',
    'Tỵ',
    'Ngọ',
    'Mùi',
    'Thân',
    'Dậu',
    'Tuất',
    'Hợi',
  ];
  return animals[(year + 8) % 12];
}
