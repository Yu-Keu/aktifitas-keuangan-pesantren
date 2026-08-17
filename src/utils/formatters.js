export function formatIDR(val) {
  if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
  const isNeg = val < 0;
  const numStr = Math.abs(Math.round(val))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNeg ? `(Rp ${numStr})` : `Rp ${numStr}`;
}

export function parseAmount(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const s = String(val).trim();
  const isNeg = s.includes('(') || s.startsWith('-');
  const clean = s.replace(/[^\d]/g, '');
  const num = parseFloat(clean) || 0;
  return isNeg ? -num : num;
}

export function parseExcelDate(rawVal) {
  if (!rawVal) return null;
  const str = String(rawVal).trim();
  const num = parseFloat(str);

  // Serial number Excel (e.g. 46075)
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    return {
      day: d.getUTCDate(),
      month: d.getUTCMonth() + 1,
      year: d.getUTCFullYear(),
      formatted: `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
    };
  }

  // Format String: 22/02/26 atau 22-02-2026
  const parts = str.split(/[\/\-\.\s]/);
  if (parts.length >= 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);
    if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
      let day = p1, month = p2, year = p3;
      if (p1 > 1000) { year = p1; month = p2; day = p3; } // format YYYY-MM-DD
      if (year < 100) year += 2000; // Ubah '26' menjadi 2026
      return {
        day, month, year,
        formatted: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
      };
    }
  }
  return null;
}