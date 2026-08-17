import { POS_MAPPING } from '../constants/posMapping.js';

export function getJenjangByClass(kelasStr = '', itemDesc = '') {
  const k = String(kelasStr).toUpperCase().trim();
  const desc = String(itemDesc).toUpperCase().trim();

  // 1. PAUD / RA / TK / KB / TPA
  if (
    k.startsWith('0') ||
    k.includes('RA') ||
    k.includes('PAUD') ||
    k.includes('TK') ||
    k.includes('KB') ||
    k.includes('KELOMPOK BERMAIN') ||
    k.includes('TPA') ||
    desc.includes('PAUD') ||
    desc.includes('RA ') ||
    desc.includes('RA 20') ||
    desc.includes('TPA')
  ) {
    return 'PAUD';
  }

  // 2. Kelas 13 (Khidmah) -> MA
  if (k.includes('13') || k.includes('KHIDMAH') || desc.includes('KHIDMAH')) {
    return 'MA';
  }

  // 3. Angka Kelas di Depan
  const match = k.match(/^(\d+)/);
  if (match) {
    const grade = parseInt(match[1], 10);
    if (grade >= 1 && grade <= 6) return 'MI';
    if (grade >= 7 && grade <= 9) return 'MTS';
    if (grade >= 10 && grade <= 13) return 'MA';
  }

  // // 4. Deteksi Romawi atau Singkatan
  // if (/\b(XIII|XII|XI|X)\b/.test(k) || k.includes('MA') || k.includes('SMA') || k.includes('ALIYAH')) return 'MA';
  // if (/\b(IX|VIII|VII)\b/.test(k) || k.includes('MTS') || k.includes('SMP') || k.includes('TSANAWIYAH')) return 'MTS';
  // if (/\b(VI|V|IV|III|II|I)\b/.test(k) || k.includes('MI') || k.includes('SD') || k.includes('IBTIDAIYAH')) return 'MI';

  // // 5. Cek kata kunci di deskripsi
  // if (desc.includes('MA ') || desc.includes('ALIYAH') || desc.includes('SMA')) return 'MA';
  // if (desc.includes('MTS') || desc.includes('TSANAWIYAH') || desc.includes('SMP')) return 'MTS';
  // if (desc.includes('MI ') || desc.includes('IBTIDAIYAH') || desc.includes('SD')) return 'MI';

  return 'MTS';
}

export function routeIncomeItem(posName = '', kelasStr = '', amount = 0, itemDesc = '', senderStr = '') {
  const pos = String(posName).toUpperCase().trim();
  const desc = String(itemDesc).toUpperCase().trim();
  const sender = String(senderStr).toUpperCase().trim();
  const jenjang = getJenjangByClass(kelasStr, itemDesc);
  const absAmount = Math.abs(Number(amount) || 0);

  // 1. PRIORITAS: DONASI & DANA TITIPAN
  if (pos.includes('DONASI') || pos.includes('TITIPAN') || desc.includes('DONASI KEMANUSIAAN')) {
    if (pos.includes('IFTHOR') || desc.includes('IFTHOR')) {
      return { kode: 'A26', desc: 'Penerimaan Lain-lain (Ifthor)' };
    }
    return { kode: 'A24', desc: 'Dana Titip (Donasi Kemanusiaan/Baksos)' };
  }

  // 2. PRIORITAS: KAFALAH YATIM
  if (pos.includes('KAFALAH') || pos.includes('YATIM') || desc.includes('KAFALAH') || desc.includes('YATIM')) {
    const fullText = `${sender} ${desc} ${pos}`;
    if (fullText.includes('YAYASAN') || fullText.includes('LAJNAH')) {
      return { kode: 'A171', desc: 'Penerimaan kafalah dari Yayasan' };
    }
    return { kode: 'A172', desc: 'Penerimaan Kafalah dari nonyayasan' };
  }

  // 3. PRIORITAS: SPP / BIAYA PONDOKAN
  if (pos.includes('SPP') || pos.includes('PONDOKAN')) {
    if (jenjang === 'PAUD') return { kode: 'A121', desc: 'Penerimaan SPP PAUD / RA / TPA' };
    if (jenjang === 'MI') return { kode: 'A122', desc: 'Penerimaan SPP MI' };
    
    const isNonAsrama = absAmount <= 600000;

    if (jenjang === 'MA') {
      return isNonAsrama
        ? { kode: 'A1233', desc: 'Penerimaan SPP MA Non Asrama' }
        : { kode: 'A1234', desc: 'Penerimaan SPP MA Asrama' };
    }
    return isNonAsrama
      ? { kode: 'A1231', desc: 'Penerimaan SPP MTs Non Asrama' }
      : { kode: 'A1232', desc: 'Penerimaan SPP MTs Asrama' };
  }

  // 4. PRIORITAS: BIAYA KEGIATAN SISWA
  if (pos.includes('KEGIATAN') || (pos.includes('SISWA') && desc.includes('KEGIATAN'))) {
    if (jenjang === 'PAUD') return { kode: 'A241', desc: 'Kegiatan PAUD / RA' };
    if (jenjang === 'MA') return { kode: 'A2402', desc: 'Kegiatan MA' };
    return { kode: 'A2401', desc: 'Kegiatan MTs' };
  }

  // 5. PRIORITAS: BOS
  if (pos.includes('BOS')) {
    if (jenjang === 'MI') return { kode: 'A141', desc: 'BOS MI' };
    if (jenjang === 'MTS') return { kode: 'A142', desc: 'BOS MTS' };
    if (jenjang === 'MA') return { kode: 'A143', desc: 'BOS MA' };
  }

  // 6. PRIORITAS: BUKU & UJIAN
  if (pos.includes('BUKU') || pos.includes('UJIAN')) {
    if (jenjang === 'MI') return { kode: 'A2341', desc: 'Buku dan Ujian MI' };
    if (jenjang === 'MTS') return { kode: 'A2342', desc: 'Buku dan Ujian MTs' };
    if (jenjang === 'MA') return { kode: 'A2343', desc: 'Buku dan Ujian MA' };
  }

  // 7. PRIORITAS: PERPUSTAKAAN
  if (pos.includes('PERPUSTAKAAN') || pos.includes('PUSTAKA')) {
    if (jenjang === 'MI') return { kode: 'A2391', desc: 'Perpustakaan MI' };
    if (jenjang === 'MTS') return { kode: 'A2392', desc: 'Perpustakaan MTs' };
    if (jenjang === 'MA') return { kode: 'A2393', desc: 'Perpustakaan MA' };
  }

  // 8. CEK POS_MAPPING EXACT & PARTIAL
  if (POS_MAPPING[pos]) {
    return { kode: POS_MAPPING[pos].kode, desc: POS_MAPPING[pos].uraian };
  }

  for (const [key, mapping] of Object.entries(POS_MAPPING)) {
    if (pos.includes(key)) {
      return { kode: mapping.kode, desc: mapping.uraian };
    }
  }

  return { kode: 'A26', desc: 'Penerimaan Lain-lain' };
}