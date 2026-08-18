// src/composables/useDaftarUlang.js
import { ref, computed } from 'vue';
import { DEFAULT_DAFTAR_ULANG_PRESETS } from '../constants/daftarUlangPresets.js';
import { getJenjangByClass } from '../utils/classClassifier.js';
import { parseAmount } from '../utils/formatters.js';

const STORAGE_KEY = 'PIT_DAFTAR_ULANG_PRESETS_V3';

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

  // VALIDASI KETAT BARIS SANTRI (MENGABAIKAN HEADER & BARIS TOTAL)
  function isInvalidStudentRow(cols) {
    const c0 = String(cols[0] || '').trim().toUpperCase();
    const c1 = String(cols[1] || '').trim().toUpperCase();
    const c2 = String(cols[2] || '').trim().toUpperCase();
    const fullLine = cols.join(' ').toUpperCase();

    // 1. Lewati Header / Sub-Header
    if (c0.includes('NO.') || c1.includes('NOMOR INDUK') || c1.includes('NOMOR') || c2.includes('NAMA SISWA')) {
      return true;
    }
    if (fullLine.includes('KELAS TERAKHIR') || (fullLine.includes('TAHUN') && fullLine.includes('NAMA KELAS'))) {
      return true;
    }

    // 2. Lewati Baris TOTAL / SUMMARY di bawah tabel
    if (c0 === 'TOTAL' || c1 === 'TOTAL' || c2 === 'TOTAL' || fullLine.startsWith('TOTAL')) {
      return true;
    }

    // 3. Lewati jika nama santri kosong / tidak valid
    if (!c2 || c2.length < 2 || c2 === 'NAMA') {
      return true;
    }

    return false;
  }

  // PARSE FILE MASTER TAGIHAN (FILE B)
  function parseTagihanSheet(rows = []) {
    let headerIdx = 0;
    for (let r = 0; r < Math.min(rows.length, 12); r++) {
      const line = (rows[r] || []).join(' ').toUpperCase();
      if (line.includes('NOMOR INDUK') || line.includes('NAMA SISWA') || line.includes('TAGIHAN')) {
        headerIdx = r;
        break;
      }
    }

    const headerRow = (rows[headerIdx] || []).map(h => String(h || '').trim().toUpperCase());

    // Deteksi Posisi Kolom
    const colIdx = {
      nis: headerRow.findIndex(h => h.includes('NOMOR INDUK') || h.includes('NIS')),
      nama: headerRow.findIndex(h => h.includes('NAMA SISWA') || h === 'NAMA'),
      jk: headerRow.findIndex(h => h.includes('KELAMIN') || h === 'JK' || h === 'L/P'),
      kelas: headerRow.findLastIndex(h => h.includes('KELAS') || h.includes('ROMBEL')),
      tagihan: headerRow.findIndex(h => h.includes('TAGIHAN')),
      dibayar: headerRow.findIndex(h => h.includes('DIBAYAR') || h.includes('BAYAR')),
      sisa: headerRow.findIndex(h => h.includes('SISA'))
    };

    const newMap = new Map();
    const list = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const cols = rows[i];
      if (!cols || cols.length < 4 || isInvalidStudentRow(cols)) continue;

      const nis = colIdx.nis !== -1 ? String(cols[colIdx.nis] || '').trim() : String(cols[1] || '').trim();
      const nama = colIdx.nama !== -1 ? String(cols[colIdx.nama] || '').trim().toUpperCase() : String(cols[2] || '').trim().toUpperCase();
      const jk = colIdx.jk !== -1 ? String(cols[colIdx.jk] || 'L').trim().toUpperCase() : String(cols[3] || 'L').trim().toUpperCase();
      const kelas = colIdx.kelas !== -1 ? String(cols[colIdx.kelas] || '').trim() : String(cols[6] || cols[5] || '').trim();
      
      const tagihan = parseAmount(colIdx.tagihan !== -1 ? cols[colIdx.tagihan] : cols[7]);
      const dibayar = parseAmount(colIdx.dibayar !== -1 ? cols[colIdx.dibayar] : cols[8]);
      const sisa = parseAmount(colIdx.sisa !== -1 ? cols[colIdx.sisa] : cols[9]);

      if (nama) {
        const studentObj = { nis, nama, jk, kelas, tagihan, dibayar, sisa };
        list.push(studentObj);
        if (nis) newMap.set(nis, studentObj);
        newMap.set(nama, studentObj);
      }
    }

    studentMasterList.value = list;
    studentTagihanMaster.value = newMap;
    return list.length;
  }

  // PENCARI SKEMA TARIF TERBAIK
  function matchPreset(tagihanAmount, kelasStr = '', descStr = '') {
    const amount = Math.abs(Number(tagihanAmount) || 0);
    const jenjang = getJenjangByClass(kelasStr, descStr);

    // 1. Cocokkan Nominal Tagihan Siswa dengan Master Skema
    if (amount > 0) {
      // Khusus tarif unik
      if (amount === 15635000) return presets.value.find(p => p.id === 'du-khusus-keysha') || presets.value[0];
      if (amount === 9000000) return presets.value.find(p => p.id === 'du-non-asrama-mi-mts') || presets.value[0];
      if (amount === 2951000) return presets.value.find(p => p.id === 'du-gtt') || presets.value[0];

      // Cocokkan nominal + jenjang yang sama
      const matched = presets.value.filter(p => p.nominal === amount);
      if (matched.length === 1) return matched[0];
      if (matched.length > 1) {
        const exactJenjang = matched.find(p => p.jenjang === jenjang);
        if (exactJenjang) return exactJenjang;
        return matched[0];
      }
    }

    // 2. Fallback Heuristik Kelas
    if (jenjang === 'MI') {
      const matchGrade = (kelasStr || '').match(/^(\d+)/);
      if (matchGrade) {
        const miPreset = presets.value.find(p => p.id === `du-mi-${matchGrade[1]}`);
        if (miPreset) return miPreset;
      }
      return presets.value.find(p => p.id === 'du-mi-2') || presets.value[0];
    }

    if (jenjang === 'MTS') {
      return presets.value.find(p => p.id === 'du-kenaikan-mts-asrama') ||
             presets.value.find(p => p.id === 'du-kenaikan-mts') ||
             presets.value[0];
    }

    if (jenjang === 'MA') {
      return presets.value.find(p => p.id === 'du-kenaikan-ma-asrama') ||
             presets.value.find(p => p.id === 'du-kenaikan-ma') ||
             presets.value[0];
    }

    return presets.value[0];
  }

  // GENERATOR RINCIAN SELURUH SANTRI (SESUAI DENGAN DIBAYAR)
  const fullBreakdownRows = computed(() => {
    const rows = [];

    studentMasterList.value.forEach((student) => {
      const preset = matchPreset(student.tagihan, student.kelas, student.nama);
      let availableCash = Math.abs(Number(student.dibayar) || 0);

      // Jalankan alokasi waterfall per item pos
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

      // TAMPUNG LEBIH BAYAR JIKA ADA (Agar total selalu 100% klop)
      if (availableCash > 0) {
        rows.push({
          nis: student.nis,
          nama: student.nama,
          jk: student.jk,
          kelas: student.kelas,
          posName: 'KELEBIHAN PEMBAYARAN',
          code: 'A26',
          amount: availableCash
        });
      }
    });

    return rows;
  });

  // WATERFALL ENGINE UNTUK PENERIMAAN KASIR
  function runWaterfallSplit(allTransactions = []) {
    let splitCount = 0;
    let skippedPastYearCount = 0;
    let failedCount = 0;

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

      const nisKey = tx.nis || tx.senderOrStudent || tx.desc;
      const studentInfo = studentTagihanMaster.value.get(tx.nis) || studentTagihanMaster.value.get(tx.senderOrStudent?.toUpperCase());
      const targetTarif = studentInfo ? studentInfo.tagihan : tx.amount;
      const preset = matchPreset(targetTarif, tx.kelas, tx.desc);

      if (!preset || !preset.items || preset.items.length === 0) {
        resultList.push(tx);
        failedCount++;
        return;
      }

      if (!studentAllocationTracker.has(nisKey)) {
        studentAllocationTracker.set(nisKey, new Map());
      }
      const itemAllocatedMap = studentAllocationTracker.get(nisKey);

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
      skippedPastYearCount,
      failedCount
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