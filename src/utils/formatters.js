// src/utils/formatters.js

export const MONTH_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_NAMES_SHORT = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatIDR(val) {
  if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
  const num = Number(val);
  const isNeg = num < 0;
  const numStr = Math.abs(Math.round(num))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNeg ? `(Rp ${numStr})` : `Rp ${numStr}`;
}

export function formatRupiah(val) {
  return formatIDR(val);
}

export function parseAmount(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;

  let s = String(val).trim();
  const isNeg = s.includes('(') || s.startsWith('-');

  let clean = s.replace(/[^\d.,]/g, '');

  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',') && !clean.includes('.')) {
    const parts = clean.split(',');
    if (parts[1] && parts[1].length <= 2) {
      clean = parts[0] + '.' + parts[1];
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes('.') && !clean.includes(',')) {
    const parts = clean.split('.');
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      clean = clean.replace(/\./g, '');
    }
  }

  const num = parseFloat(clean) || 0;
  return isNeg ? -num : num;
}

export function parseExcelDate(rawVal) {
  if (!rawVal) return null;
  const str = String(rawVal).trim();
  const num = parseFloat(str);

  // Serial Date Excel (misal: 45400)
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    const day = d.getUTCDate();
    const month = d.getUTCMonth() + 1;
    const year = d.getUTCFullYear();
    return {
      day,
      month,
      year,
      monthKey: `${year}-${String(month).padStart(2, '0')}`,
      formatted: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    };
  }

  // Format String: DD/MM/YYYY atau YYYY-MM-DD
  const parts = str.split(/[\/\-\.\s]/);
  if (parts.length >= 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);
    if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
      let day = p1, month = p2, year = p3;
      if (p1 > 1000) { year = p1; month = p2; day = p3; }
      if (year < 100) year += 2000;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return {
          day,
          month,
          year,
          monthKey: `${year}-${String(month).padStart(2, '0')}`,
          formatted: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
        };
      }
    }
  }
  return null;
}