import { POS_MAPPING } from '../constants/posMapping.js';

/**
 * Mendeteksi jenjang sekolah (PAUD, MI, MTS, MA) berdasarkan string Kelas & Deskripsi
 */
export function getJenjangByClass(kelasStr = '', itemDesc = '') {
  const k = String(kelasStr).toUpperCase().trim();
  const desc = String(itemDesc).toUpperCase().trim();

  // 1. Deteksi PAUD / RA / TK / KB / TPA
  if (
    k.startsWith('0') ||
    k.includes('RA') ||
    k.includes('PAUD') ||
    k.includes('TK') ||
    k.includes('KB') ||
    k.includes('TPA') ||
    desc.includes('PAUD') ||
    desc.includes('RA ') ||
    desc.includes('TPA')
  ) {
    return 'PAUD';
  }

  // 2. Deteksi Khusus Kelas 13 (Khidmah) -> Wajib MA
  if (k.includes('13') || k.includes('KHIDMAH') || desc.includes('KHIDMAH')) {
    return 'MA';
  }

  // 3. Ekstrak Angka Kelas di Awal (misal: "7A", "10 IPA", "1", "12 IPS", "13")
  const match = k.match(/^(\d+)/);
  if (match) {
    const grade = parseInt(match[1], 10);
    if (grade >= 1 && grade <= 6) return 'MI';
    if (grade >= 7 && grade <= 9) return 'MTS';
    if (grade >= 10 && grade <= 13) return 'MA'; // Kelas 10, 11, 12, 13 (Khidmah)
  }

  // 4. Cek Angka Romawi atau Singkatan
  if (/\b(XIII|XII|XI|X)\b/.test(k) || k.includes('MA') || k.includes('SMA') || k.includes('ALIYAH')) {
    return 'MA';
  }
  if (/\b(IX|VIII|VII)\b/.test(k) || k.includes('MTS') || k.includes('SMP') || k.includes('TSANAWIYAH')) {
    return 'MTS';
  }
  if (/\b(VI|V|IV|III|II|I)\b/.test(k) || k.includes('MI') || k.includes('SD') || k.includes('IBTIDAIYAH')) {
    return 'MI';
  }

  // 5. Cek kata kunci pada uraian transaksi
  if (desc.includes('MA ') || desc.includes('ALIYAH') || desc.includes('SMA')) return 'MA';
  if (desc.includes('MTS') || desc.includes('TSANAWIYAH') || desc.includes('SMP')) return 'MTS';
  if (desc.includes('MI ') || desc.includes('IBTIDAIYAH') || desc.includes('SD')) return 'MI';

  // Default fallback jika tidak ada keterangan kelas
  return 'MTS';
}

/**
 * Router Universal Pos Penerimaan berbasis Jenjang & Nominal
 */
export function routeIncomeItem(posName = '', kelasStr = '', amount = 0, itemDesc = '') {
  const pos = String(posName).toUpperCase().trim();
  const desc = String(itemDesc).toUpperCase().trim();
  const jenjang = getJenjangByClass(kelasStr, itemDesc);
  const isNonAsrama = amount <= 600000;

  // 1. SPP / BIAYA PONDOKAN
  if (pos.includes('SPP') || pos.includes('PONDOKAN') || desc.includes('SPP')) {
    if (jenjang === 'PAUD') return { kode: 'A121', desc: 'Penerimaan SPP PAUD / RA / TPA' };
    if (jenjang === 'MI') return { kode: 'A122', desc: 'Penerimaan SPP MI' };
    if (jenjang === 'MTS') {
      return isNonAsrama
        ? { kode: 'A1231', desc: 'Penerimaan SPP MTs Non Asrama' }
        : { kode: 'A1232', desc: 'Penerimaan SPP MTs Asrama' };
    }
    if (jenjang === 'MA') {
      return isNonAsrama
        ? { kode: 'A1233', desc: 'Penerimaan SPP MA Non Asrama' }
        : { kode: 'A1234', desc: 'Penerimaan SPP MA Asrama' };
    }
  }

  // 2. BANTUAN OPERASIONAL SEKOLAH (BOS)
  if (pos.includes('BOS') || desc.includes('BOS')) {
    if (jenjang === 'MI') return { kode: 'A141', desc: 'BOS MI' };
    if (jenjang === 'MTS') return { kode: 'A142', desc: 'BOS MTS' };
    if (jenjang === 'MA') return { kode: 'A143', desc: 'BOS MA' };
  }

  // 3. BUKU DAN UJIAN
  if (pos.includes('BUKU') || pos.includes('UJIAN') || desc.includes('BUKU') || desc.includes('UJIAN')) {
    if (jenjang === 'MI') return { kode: 'A2341', desc: 'Buku dan Ujian MI' };
    if (jenjang === 'MTS') return { kode: 'A2342', desc: 'Buku dan Ujian MTs' };
    if (jenjang === 'MA') return { kode: 'A2343', desc: 'Buku dan Ujian MA' };
  }

  // 4. PERPUSTAKAAN
  if (pos.includes('PERPUSTAKAAN') || pos.includes('PUSTAKA') || desc.includes('PERPUSTAKAAN')) {
    if (jenjang === 'MI') return { kode: 'A2391', desc: 'Perpustakaan MI' };
    if (jenjang === 'MTS') return { kode: 'A2392', desc: 'Perpustakaan MTs' };
    if (jenjang === 'MA') return { kode: 'A2393', desc: 'Perpustakaan MA' };
  }

  // 5. KEGIATAN SISWA
  if (pos.includes('KEGIATAN') || desc.includes('KEGIATAN')) {
    if (jenjang === 'PAUD') return { kode: 'A241', desc: 'Kegiatan PAUD' };
    if (jenjang === 'MTS') return { kode: 'A2401', desc: 'Kegiatan MTs' };
    if (jenjang === 'MA') return { kode: 'A2402', desc: 'Kegiatan MA' };
  }

  // 6. PERLENGKAPAN SEKOLAH
  if (pos.includes('PERLENGKAPAN SEKOLAH') || desc.includes('PERLENGKAPAN SEKOLAH')) {
    if (jenjang === 'PAUD') return { kode: 'A2331', desc: 'Perlengkapan Sekolah PAUD' };
    return { kode: 'A2332', desc: 'Perlengkapan Sekolah MTs dan MA' };
  }

  // 7. SERAGAM
  if (pos.includes('SERAGAM') || desc.includes('SERAGAM')) {
    if (jenjang === 'PAUD') return { kode: 'A237', desc: 'Seragam PAUD' };
    return { kode: 'A236', desc: 'Bahan Seragam' };
  }

  // 8. DAFTAR ULANG
  if (pos.includes('DAFTAR ULANG') || desc.includes('DAFTAR ULANG')) {
    return { kode: 'A241_DU', desc: 'Daftar Ulang Kenaikan Kelas' };
  }

  // 9. COCOKKAN KE POS MAPPING UMUM
  if (POS_MAPPING[pos]) {
    return { kode: POS_MAPPING[pos].kode, desc: POS_MAPPING[pos].uraian };
  }

  return { kode: 'A26', desc: 'Penerimaan Lain-lain' };
}