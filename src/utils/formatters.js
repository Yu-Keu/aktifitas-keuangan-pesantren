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

  if (!isNaN(num) && num > 30000 && num < 60000) {
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    return {
      day: d.getUTCDate(),
      month: d.getUTCMonth() + 1,
      year: d.getUTCFullYear(),
      formatted: `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
    };
  }

  const parts = str.split(/[\/\-\.\s]/);
  if (parts.length >= 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);
    if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
      let day = p1, month = p2, year = p3;
      if (p1 > 1000) { year = p1; month = p2; day = p3; }
      if (year < 100) year += 2000;
      return {
        day, month, year,
        formatted: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
      };
    }
  }
  return null;
}