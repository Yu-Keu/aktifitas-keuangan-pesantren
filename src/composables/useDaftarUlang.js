// src/composables/useDaftarUlang.js
import { ref, computed } from 'vue';
import { DEFAULT_DAFTAR_ULANG_PRESETS } from '../constants/daftarUlangPresets.js';
import { getJenjangByClass } from '../utils/classClassifier.js';
import { parseAmount, formatIDR } from '../utils/formatters.js';

const STORAGE_KEY = 'PIT_DAFTAR_ULANG_PRESETS_V3';

function cleanKey(str = '') {
  return String(str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

export function useDaftarUlang() {
  const presets = ref(loadPresets());
  const studentMasterList = ref([]);
  const studentTagihanMaster = ref(new Map());

  function loadPresets() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Gagal memuat preset:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DAFTAR_ULANG_PRESETS));
  }

  function savePresets(newPresets) {
    presets.value = newPresets;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
  }

  function resetToDefault() {
    savePresets(JSON.parse(JSON.stringify(DEFAULT_DAFTAR_ULANG_PRESETS)));
  }

  function createNewPreset(customData = {}) {
    const newPreset = {
      id: `du-custom-${Date.now()}`,
      name: customData.name || 'DAFTAR ULANG KERINGANAN (EDIT NAMA)',
      nominal: customData.nominal || 0,
      jenjang: customData.jenjang || 'MI',
      items: customData.items || [
        { id: `item-${Date.now()}-1`, name: 'BUKU MI', code: 'A2341', amount: 0 },
        { id: `item-${Date.now()}-2`, name: 'KEGIATAN', code: 'A241', amount: 0 }
      ]
    };
    presets.value.unshift(newPreset);
    savePresets(presets.value);
    return newPreset;
  }

  function removePreset(presetId) {
    presets.value = presets.value.filter(p => p.id !== presetId);
    savePresets(presets.value);
  }

  function isInvalidStudentRow(cols) {
    if (!cols || cols.length < 4) return true;
    const c0 = String(cols[0] || '').trim().toUpperCase();
    const c1 = String(cols[1] || '').trim().toUpperCase();
    const c2 = String(cols[2] || '').trim().toUpperCase();
    const fullLine = cols.join(' ').toUpperCase();

    // Lewati baris Header & Sub-Header
    if (c0 === 'NO.' || c0 === 'NO' || c1.includes('NOMOR INDUK') || c1.includes('NIS') || c2.includes('NAMA SISWA')) {
      return true;
    }
    if (fullLine.includes('STATUS TERAKHIR') || (fullLine.includes('TAHUN') && fullLine.includes('NAMA KELAS'))) {
      return true;
    }
    if (c0 === 'TOTAL' || c1 === 'TOTAL' || c2 === 'TOTAL' || fullLine.startsWith('TOTAL')) {
      return true;
    }
    if (!c2 || c2.length < 2 || c2 === 'NAMA' || c2 === 'NAMA SISWA') {
      return true;
    }

    return false;
  }

  // PARSE FILE MASTER TAGIHAN (DENGAN DETEKSI HEADER STRICT & TEPAT)
  function parseTagihanSheet(rows = []) {
    let headerIdx = -1;

    // 1. Cari baris header tabel yang ASLI (harus ada NOMOR INDUK + NAMA + TAGIHAN)
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const line = (rows[r] || []).map(cell => String(cell || '').toUpperCase().trim()).join(' ');
      if (
        (line.includes('NOMOR INDUK') || line.includes('NIS')) &&
        (line.includes('NAMA SISWA') || line.includes('NAMA')) &&
        line.includes('TAGIHAN')
      ) {
        headerIdx = r;
        break;
      }
    }

    // Fallback jika tidak lengkap
    if (headerIdx === -1) {
      for (let r = 0; r < Math.min(rows.length, 15); r++) {
        const line = (rows[r] || []).map(cell => String(cell || '').toUpperCase().trim()).join(' ');
        if (line.includes('NOMOR INDUK') || line.includes('NAMA SISWA')) {
          headerIdx = r;
          break;
        }
      }
    }

    if (headerIdx === -1) headerIdx = 0;

    const headerRow = (rows[headerIdx] || []).map(h => String(h || '').trim().toUpperCase());
    const subHeaderRow = (rows[headerIdx + 1] || []).map(h => String(h || '').trim().toUpperCase());

    // 2. Pemetaan Kolom Presisi Berdasarkan Header Screenshot Excel Anda
    const colIdx = {
      nis: headerRow.findIndex(h => h === 'NOMOR INDUK' || h === 'NIS' || (h.includes('INDUK') && !h.includes('KELAS'))),
      nama: headerRow.findIndex(h => h === 'NAMA SISWA' || h === 'NAMA' || h.includes('NAMA SISWA')),
      jk: headerRow.findIndex(h => h === 'JENIS KELAMIN' || h === 'JK' || h === 'L/P' || h.includes('KELAMIN')),
      kelas: -1,
      tagihan: headerRow.findIndex(h => h === 'TAGIHAN'),
      dibayar: headerRow.findIndex(h => h === 'DIBAYAR' || h === 'BAYAR'),
      sisa: headerRow.findIndex(h => h === 'SISA')
    };

    // Deteksi letak Kolom Kelas (di sub-header kolom 6 atau di samping Tahun)
    colIdx.kelas = subHeaderRow.findIndex(h => h === 'NAMA KELAS' || h === 'KELAS');
    if (colIdx.kelas === -1) {
      colIdx.kelas = headerRow.findIndex(h => h === 'NAMA KELAS');
    }
    if (colIdx.kelas === -1) {
      const kelasTerakhirIdx = headerRow.findIndex(h => h.includes('KELAS TERAKHIR'));
      colIdx.kelas = kelasTerakhirIdx !== -1 ? kelasTerakhirIdx + 1 : 6;
    }

    // Default Fallback sesuai struktur baku template PIT
    if (colIdx.nis === -1) colIdx.nis = 1;
    if (colIdx.nama === -1) colIdx.nama = 2;
    if (colIdx.jk === -1) colIdx.jk = 3;
    if (colIdx.kelas === -1) colIdx.kelas = 6;
    if (colIdx.tagihan === -1) colIdx.tagihan = 7;
    if (colIdx.dibayar === -1) colIdx.dibayar = 8;
    if (colIdx.sisa === -1) colIdx.sisa = 9;

    const newMap = new Map();
    const list = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const cols = rows[i];
      if (isInvalidStudentRow(cols)) continue;

      const nis = String(cols[colIdx.nis] || '').trim();
      const nama = String(cols[colIdx.nama] || '').trim().toUpperCase();
      const jk = String(cols[colIdx.jk] || 'L').trim().toUpperCase();
      
      // Ambil Nama Kelas (jika terbaca tahun "2026/2027", ambil kolom sebelahnya)
      let kelas = String(cols[colIdx.kelas] || '').trim();
      if (kelas.includes('/') || (kelas.length === 4 && !isNaN(Number(kelas)))) {
        if (cols[colIdx.kelas + 1]) kelas = String(cols[colIdx.kelas + 1]).trim();
      }

      const tagihan = parseAmount(cols[colIdx.tagihan]);
      const dibayar = parseAmount(cols[colIdx.dibayar]);
      const sisa = parseAmount(cols[colIdx.sisa]);

      if (nama) {
        const studentObj = { nis, nama, jk, kelas, tagihan, dibayar, sisa };
        list.push(studentObj);
        
        if (nis) {
          newMap.set(cleanKey(nis), studentObj);
          newMap.set(nis, studentObj);
        }
        newMap.set(cleanKey(nama), studentObj);
        newMap.set(nama, studentObj);
      }
    }

    studentMasterList.value = list;
    studentTagihanMaster.value = newMap;
    return list.length;
  }

  // PENCARI SKEMA TARIF: HANYA BERDASARKAN NOMINAL MATCHING
  function matchPreset(tagihanAmount, kelasStr = '', descStr = '') {
    const amount = Math.abs(Number(tagihanAmount) || 0);
    const jenjang = getJenjangByClass(kelasStr, descStr);

    if (amount > 0) {
      const matched = presets.value.filter(p => Number(p.nominal) === amount);
      
      if (matched.length === 1) return matched[0];
      if (matched.length > 1) {
        const exactJenjang = matched.find(p => p.jenjang === jenjang);
        if (exactJenjang) return exactJenjang;
        return matched[0];
      }
    }

    return null;
  }

  // GENERATOR RINCIAN SELURUH SANTRI (TAB DAFTAR ULANG)
  const fullBreakdownRows = computed(() => {
    const rows = [];

    studentMasterList.value.forEach((student) => {
      const preset = matchPreset(student.tagihan, student.kelas, student.nama);
      let availableCash = Math.abs(Number(student.dibayar) || 0);

      // JIKA TIDAK ADA SKEMA YANG COCOK: Tampilkan 1 baris utuh
      if (!preset) {
        rows.push({
          nis: student.nis,
          nama: student.nama,
          jk: student.jk,
          kelas: student.kelas,
          posName: `Daftar Ulang [Skema ${formatIDR(student.tagihan)} Belum Diset]`,
          code: 'A241_DU',
          amount: availableCash
        });
        return;
      }

      // JIKA COCOK DENGAN PRESET: Alirkan dana pos per pos (Waterfall)
      (preset.items || []).forEach((item) => {
        const maxTarget = Number(item.amount) || 0;
        const allocated = Math.min(availableCash, maxTarget);
        availableCash -= allocated;

        rows.push({
          nis: student.nis,
          nama: student.nama,
          jk: student.jk,
          kelas: student.kelas,
          posName: item.name,
          code: item.code,
          amount: allocated
        });
      });

      // Kelebihan bayar HANYA jika santri membayar melebihi total kuota preset
      if (availableCash > 0) {
        rows.push({
          nis: student.nis,
          nama: student.nama,
          jk: student.jk,
          kelas: student.kelas,
          posName: 'Kelebihan Pembayaran Daftar Ulang',
          code: 'A26',
          amount: availableCash
        });
      }
    });

    return rows;
  });

  // WATERFALL ENGINE TRANSAKSI KASIR (PENERIMAAN)
  function runWaterfallSplit(allTransactions = []) {
    let splitCount = 0;
    let unmatchedCount = 0;
    let skippedPastYearCount = 0;

    const studentAllocationTracker = new Map();
    const resultList = [];

    allTransactions.forEach((tx) => {
      const isDU = tx.code === 'A241_DU' || (tx.pos && tx.pos.toUpperCase().includes('DAFTAR ULANG'));
      
      if (!isDU) {
        resultList.push(tx);
        return;
      }

      const descUpper = String(tx.desc || '').toUpperCase();
      const tapelUpper = String(tx.tapel || '').toUpperCase();
      if (descUpper.includes('2025/2026') || tapelUpper.includes('2025/2026')) {
        resultList.push({
          ...tx,
          code: 'A241_DU',
          desc: `${tx.desc} [TAPEL 2025/2026 - Tahun Lalu]`
        });
        skippedPastYearCount++;
        return;
      }

      const cleanNis = cleanKey(tx.nis);
      const cleanNama = cleanKey(tx.senderOrStudent);
      
      let studentInfo = null;
      if (cleanNis) studentInfo = studentTagihanMaster.value.get(cleanNis);
      if (!studentInfo && cleanNama) {
        studentInfo = studentTagihanMaster.value.get(cleanNama);
      }

      const targetTarif = studentInfo ? studentInfo.tagihan : tx.amount;
      const targetKelas = (studentInfo && studentInfo.kelas) ? studentInfo.kelas : tx.kelas;
      const preset = matchPreset(targetTarif, targetKelas, tx.desc);

      // JIKA SKEMA BELUM DISET: Jangan di-split, biarkan utuh di A241_DU
      if (!preset || !preset.items || preset.items.length === 0) {
        resultList.push({
          ...tx,
          code: 'A241_DU',
          desc: `${tx.desc} [Skema Tarif ${formatIDR(targetTarif)} Belum Diset]`,
          isUnmatchedScheme: true
        });
        unmatchedCount++;
        return;
      }

      // JIKA SKEMA COCOK: Jalankan Waterfall
      const trackerKey = cleanNis || cleanNama || cleanKey(tx.desc);
      if (!studentAllocationTracker.has(trackerKey)) {
        studentAllocationTracker.set(trackerKey, new Map());
      }
      const itemAllocatedMap = studentAllocationTracker.get(trackerKey);

      let availableCash = Math.abs(Number(tx.amount) || 0);
      const splitsForThisTx = [];

      for (const item of preset.items) {
        if (availableCash <= 0) break;

        const maxItemTarget = Number(item.amount) || 0;
        const alreadyAllocated = itemAllocatedMap.get(item.id) || 0;
        const remainingCapacity = Math.max(0, maxItemTarget - alreadyAllocated);

        if (remainingCapacity > 0) {
          const allocateNow = Math.min(availableCash, remainingCapacity);
          if (allocateNow > 0) {
            itemAllocatedMap.set(item.id, alreadyAllocated + allocateNow);
            availableCash -= allocateNow;

            splitsForThisTx.push({
              code: item.code,
              name: item.name,
              amount: allocateNow
            });
          }
        }
      }

      if (availableCash > 0) {
        splitsForThisTx.push({
          code: 'A26',
          name: 'Kelebihan Pembayaran Daftar Ulang',
          amount: availableCash
        });
      }

      splitsForThisTx.forEach((split, sIdx) => {
        resultList.push({
          ...tx,
          id: `${tx.id}-DUSPLIT-${sIdx + 1}-${Date.now()}`,
          code: split.code,
          desc: `${split.name} (${preset.name}) - [${tx.desc}]`,
          amount: split.amount,
          isSplitItem: true
        });
      });

      splitCount++;
    });

    return {
      updatedTransactions: resultList,
      splitCount,
      unmatchedCount,
      skippedPastYearCount
    };
  }

  return {
    presets,
    studentMasterList,
    fullBreakdownRows,
    studentTagihanMaster,
    savePresets,
    resetToDefault,
    createNewPreset,
    removePreset,
    parseTagihanSheet,
    runWaterfallSplit
  };
}