// src/composables/useFinance.js
import { ref, computed, nextTick } from 'vue';
import * as XLSX from 'xlsx';
import { REPORT_STRUCTURE } from '../constants/reportStructure.js';
import { MASTER_COA_LIST } from '../constants/coa.js';
import { routeIncomeItem } from '../utils/classClassifier.js';
import { parseExcelDate, parseAmount, formatIDR, MONTH_NAMES, MONTH_NAMES_SHORT } from '../utils/formatters.js';
import { useDaftarUlang } from './useDaftarUlang.js';
import { buildDaftarUlangFullExcel, downloadReportBundleZip, buildActivityMatrixWorkbook } from '../utils/exportBundle.js';

export function useFinance() {
  const activeTab = ref('report');
  const isLoading = ref(false);
  const loadingStatus = ref('');
  const savedScrollPosition = ref(0);

  const {
    presets,
    studentMasterList,
    fullBreakdownRows,
    savePresets,
    parseTagihanSheet,
    runWaterfallSplit
  } = useDaftarUlang();

  const filesStatus = ref({
    pengeluaran: { uploaded: false, fileName: '', count: 0 },
    penerimaan: { uploaded: false, fileName: '', count: 0 },
    tagihanDU: { uploaded: false, fileName: '', count: 0 }
  });

  const uploadResultModal = ref({
    show: false,
    success: true,
    title: '',
    fileName: '',
    loadedCount: 0,
    skippedCount: 0,
    message: ''
  });

  // Modal States
  const isSplitModalOpen = ref(false);
  const targetSplitTransaction = ref(null);
  const isReassignModalOpen = ref(false);
  const reassignTargetIds = ref([]);
  const singleReassignTransaction = ref(null);

  // Periode Settings
  const now = new Date();
  const periodMode = ref('single');
  const selectedMonth = ref(now.getMonth() + 1);
  const selectedYear = ref(now.getFullYear());
  const selectedAcademicYear = ref(2026);
  const hideEmptyMonthColumns = ref(true);

  // Master Transaksi Asli (rawTransactions) & Transaksi Tampil (transactions)
  const rawTransactions = ref([]);
  const transactions = ref([]);
  const selectedAccountDetail = ref(null);

  const activePeriodLabel = computed(() => {
    if (periodMode.value === 'single') {
      return `${MONTH_NAMES[selectedMonth.value]} ${selectedYear.value}`;
    }
    if (periodMode.value === 'academic') {
      return `T.A. ${selectedAcademicYear.value}/${selectedAcademicYear.value + 1} (Juli ${selectedAcademicYear.value} – Juni ${selectedAcademicYear.value + 1})`;
    }
    return 'Semua Periode Transaksi';
  });

  const filteredTransactionsByPeriod = computed(() => {
    if (periodMode.value === 'single') {
      return transactions.value.filter(
        t => t.month === selectedMonth.value && t.year === selectedYear.value
      );
    }
    if (periodMode.value === 'academic') {
      const startYr = selectedAcademicYear.value;
      return transactions.value.filter(t => {
        if (!t.year || !t.month) return false;
        if (t.year === startYr && t.month >= 7) return true;
        if (t.year === startYr + 1 && t.month <= 6) return true;
        return false;
      });
    }
    return transactions.value;
  });

  const availableMonthsInDataset = computed(() => {
    const map = new Map();
    transactions.value.forEach(t => {
      if (t.year && t.month) {
        const key = `${t.year}-${String(t.month).padStart(2, '0')}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            year: t.year,
            month: t.month,
            label: `${MONTH_NAMES_SHORT[t.month]} ${t.year}`,
            fullLabel: `${MONTH_NAMES[t.month]} ${t.year}`
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  });

  const visibleMonths = computed(() => {
    if (periodMode.value === 'single') {
      const key = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`;
      return [{
        key,
        year: selectedYear.value,
        month: selectedMonth.value,
        label: `${MONTH_NAMES_SHORT[selectedMonth.value]} ${selectedYear.value}`,
        fullLabel: `${MONTH_NAMES[selectedMonth.value]} ${selectedYear.value}`
      }];
    }

    if (periodMode.value === 'academic') {
      const startYr = selectedAcademicYear.value;
      const academicSequence = [
        { m: 7, y: startYr }, { m: 8, y: startYr }, { m: 9, y: startYr },
        { m: 10, y: startYr }, { m: 11, y: startYr }, { m: 12, y: startYr },
        { m: 1, y: startYr + 1 }, { m: 2, y: startYr + 1 }, { m: 3, y: startYr + 1 },
        { m: 4, y: startYr + 1 }, { m: 5, y: startYr + 1 }, { m: 6, y: startYr + 1 }
      ];

      const monthsWithData = new Set(
        filteredTransactionsByPeriod.value.map(t => `${t.year}-${String(t.month).padStart(2, '0')}`)
      );

      const sequence = academicSequence.map(seq => {
        const key = `${seq.y}-${String(seq.m).padStart(2, '0')}`;
        return {
          key,
          year: seq.y,
          month: seq.m,
          label: `${MONTH_NAMES_SHORT[seq.m]} ${seq.y}`,
          fullLabel: `${MONTH_NAMES[seq.m]} ${seq.y}`,
          hasData: monthsWithData.has(key)
        };
      });

      if (hideEmptyMonthColumns.value) {
        const filtered = sequence.filter(m => m.hasData);
        return filtered.length > 0 ? filtered : sequence.slice(0, 1);
      }
      return sequence;
    }

    return availableMonthsInDataset.value.length > 0
      ? availableMonthsInDataset.value
      : [{
          key: `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`,
          year: selectedYear.value,
          month: selectedMonth.value,
          label: `${MONTH_NAMES_SHORT[selectedMonth.value]} ${selectedYear.value}`,
          fullLabel: `${MONTH_NAMES[selectedMonth.value]} ${selectedYear.value}`
        }];
  });

  const codeSumMatrix = computed(() => {
    const matrix = {};
    const periodTxs = filteredTransactionsByPeriod.value;

    for (let i = 0; i < periodTxs.length; i++) {
      const t = periodTxs[i];
      const code = t.code || 'A26';
      const mKey = t.monthKey || `${t.year}-${String(t.month).padStart(2, '0')}`;
      const amt = Number(t.amount) || 0;

      if (!matrix[code]) {
        matrix[code] = { total: 0 };
      }
      matrix[code].total += amt;
      matrix[code][mKey] = (matrix[code][mKey] || 0) + amt;
    }

    return matrix;
  });

  function getCodeSum(code, monthKey = null) {
    const codeData = codeSumMatrix.value[code];
    if (!codeData) return 0;
    if (monthKey) return codeData[monthKey] || 0;
    return codeData.total || 0;
  }

  function getGroupTotal(group, monthKey = null) {
    return (group.items || []).reduce((sum, item) => sum + getCodeSum(item.code, monthKey), 0);
  }

  function getSectionTotal(sectionGroups, monthKey = null) {
    return (sectionGroups || []).reduce((acc, g) => acc + getGroupTotal(g, monthKey), 0);
  }

  function sumPenerimaanRutin(monthKey = null) {
    return getSectionTotal(REPORT_STRUCTURE.penerimaanRutin.groups, monthKey);
  }

  function sumPenerimaanTidakRutin(monthKey = null) {
    return getSectionTotal(REPORT_STRUCTURE.penerimaanTidakRutin.groups, monthKey);
  }

  function grandTotalIncome(monthKey = null) {
    return sumPenerimaanRutin(monthKey) + sumPenerimaanTidakRutin(monthKey);
  }

  function sumBebanRutin(monthKey = null) {
    return getSectionTotal(REPORT_STRUCTURE.bebanRutin.groups, monthKey);
  }

  function sumBebanTidakRutin(monthKey = null) {
    return getSectionTotal(REPORT_STRUCTURE.bebanTidakRutin.groups, monthKey);
  }

  function grandTotalExpense(monthKey = null) {
    return sumBebanRutin(monthKey) + sumBebanTidakRutin(monthKey);
  }

  function surplusDeficit(monthKey = null) {
    return grandTotalIncome(monthKey) - grandTotalExpense(monthKey);
  }

  function setDetailAccount(item) {
    savedScrollPosition.value = window.pageYOffset || document.documentElement.scrollTop || 0;
    selectedAccountDetail.value = item;
    activeTab.value = 'detail';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function backToReport() {
    activeTab.value = 'report';
    nextTick(() => {
      window.scrollTo({ top: savedScrollPosition.value, behavior: 'instant' });
    });
  }

  function clearAllData() {
    if (confirm('Kosongkan semua data transaksi yang sudah dimuat?')) {
      rawTransactions.value = [];
      transactions.value = [];
      studentMasterList.value = [];
      selectedAccountDetail.value = null;
      filesStatus.value.pengeluaran = { uploaded: false, fileName: '', count: 0 };
      filesStatus.value.penerimaan = { uploaded: false, fileName: '', count: 0 };
      filesStatus.value.tagihanDU = { uploaded: false, fileName: '', count: 0 };
    }
  }

  function openReassignModal(item) {
    singleReassignTransaction.value = item;
    reassignTargetIds.value = [item.id];
    isReassignModalOpen.value = true;
  }

  function openMassReassignModal(selectedIds) {
    if (!selectedIds || selectedIds.length === 0) return;
    singleReassignTransaction.value = null;
    reassignTargetIds.value = [...selectedIds];
    isReassignModalOpen.value = true;
  }

  function handleConfirmReassign({ transactionIds, newCode }) {
    if (!transactionIds || transactionIds.length === 0) return;
    transactions.value.forEach(t => {
      if (transactionIds.includes(t.id)) {
        t.code = newCode;
      }
    });
    isReassignModalOpen.value = false;
    reassignTargetIds.value = [];
    singleReassignTransaction.value = null;
  }

  function deleteTransaction(transactionId) {
    if (confirm('Hapus baris transaksi ini?')) {
      transactions.value = transactions.value.filter(t => t.id !== transactionId);
      rawTransactions.value = rawTransactions.value.filter(t => t.id !== transactionId);
    }
  }

  function deleteMassTransactions(transactionIds) {
    if (!transactionIds || transactionIds.length === 0) return;
    if (confirm(`Hapus ${transactionIds.length} transaksi terpilih?`)) {
      transactions.value = transactions.value.filter(t => !transactionIds.includes(t.id));
      rawTransactions.value = rawTransactions.value.filter(t => !transactionIds.includes(t.id));
    }
  }

  function openSplitModal(item) {
    targetSplitTransaction.value = item;
    isSplitModalOpen.value = true;
  }

  function handleSaveSplit({ originalId, splits }) {
    const idx = transactions.value.findIndex(t => t.id === originalId);
    if (idx === -1) return;

    const original = transactions.value[idx];
    const newItems = splits.map((s, i) => ({
      ...original,
      id: `${original.id}-SPLIT-${i + 1}-${Date.now()}`,
      code: s.code,
      desc: s.desc || original.desc,
      amount: Number(s.amount),
      isSplitItem: true
    }));

    transactions.value.splice(idx, 1, ...newItems);
    isSplitModalOpen.value = false;
    targetSplitTransaction.value = null;
  }

  // Selalu eksekusi split dari rawTransactions
  function executeAutoSplitDaftarUlang() {
    const result = runWaterfallSplit(rawTransactions.value);
    transactions.value = result.updatedTransactions;
    return result;
  }

  async function processExcelFile(file, type) {
    isLoading.value = true;
    loadingStatus.value = `Membaca file ${file.name}...`;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // A. File Tagihan Daftar Ulang
          if (type === 'tagihan_du') {
            const ws = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            const count = parseTagihanSheet(rows);

            filesStatus.value.tagihanDU = {
              uploaded: true,
              fileName: file.name,
              count
            };

            const splitRes = executeAutoSplitDaftarUlang();

            uploadResultModal.value = {
              show: true,
              success: true,
              title: 'Master Tagihan DU Terpasang',
              fileName: file.name,
              loadedCount: count,
              skippedCount: splitRes.skippedPastYearCount,
              message: `Berhasil memuat ${count} santri. ${splitRes.splitCount} transaksi kasir ter-split ke pos masing-masing, dan ${splitRes.unmatchedCount} transaksi tetap di pos Daftar Ulang (karena skema tarif belum diset).`
            };

            resolve({ loadedCount: count, skippedCount: 0 });
            return;
          }

          let worksheet = null;
          if (type === 'pengeluaran') {
            const kasKecilSheetName = workbook.SheetNames.find(
              name => name.trim().toLowerCase().replace(/\s+/g, '') === 'kaskecil'
            );
            worksheet = workbook.Sheets[kasKecilSheetName || workbook.SheetNames[0]];
          } else {
            worksheet = workbook.Sheets[workbook.SheetNames[0]];
          }

          if (!worksheet) throw new Error('Sheet data tidak ditemukan.');

          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          let loadedCount = 0;
          const newItems = [];

          // B. Pengeluaran (Kas Kecil)
          if (type === 'pengeluaran') {
            let headerIdx = 3;
            for (let r = 0; r < Math.min(rows.length, 10); r++) {
              const line = (rows[r] || []).join(' ').toUpperCase();
              if (line.includes('TANGGAL') || line.includes('KOD PER') || line.includes('URAIAN')) {
                headerIdx = r;
                break;
              }
            }

            for (let i = headerIdx + 1; i < rows.length; i++) {
              const cols = rows[i];
              if (!cols || cols.length < 3) continue;

              const colA = String(cols[0] || '').trim();
              const colC = String(cols[2] || '').trim();
              const rawCode = (colA !== '' ? colA : colC).toUpperCase().replace(/\s+/g, '');

              if (!rawCode || rawCode === '1' || rawCode === '2') continue;

              const parsedDate = parseExcelDate(cols[1]);
              const rawDesc = String(cols[5] || cols[4] || cols[3] || `Pengeluaran ${rawCode}`).trim();
              const pic = String(cols[6] || '-').trim();

              let amount = Math.abs(parseAmount(cols[12]));
              if (amount === 0 && cols[11] !== undefined) {
                amount = Math.abs(parseAmount(cols[11]));
              }

              if (amount > 0) {
                const tYear = parsedDate ? parsedDate.year : selectedYear.value;
                const tMonth = parsedDate ? parsedDate.month : selectedMonth.value;

                newItems.push({
                  id: `EXP-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
                  date: parsedDate ? parsedDate.formatted : String(cols[1] || ''),
                  day: parsedDate ? parsedDate.day : 1,
                  month: tMonth,
                  year: tYear,
                  monthKey: `${tYear}-${String(tMonth).padStart(2, '0')}`,
                  code: rawCode,
                  pos: String(cols[3] || 'Kas Kecil').trim(),
                  desc: rawDesc,
                  pic: pic,
                  type: 'PENGELUARAN',
                  amount: amount
                });
                loadedCount++;
              }
            }

            filesStatus.value.pengeluaran = {
              uploaded: true,
              fileName: file.name,
              count: loadedCount
            };
          }
          // C. Penerimaan Kasir
          else if (type === 'penerimaan') {
            let headerIdx = 0;
            for (let r = 0; r < Math.min(rows.length, 15); r++) {
              const line = (rows[r] || []).join(' ').toUpperCase();
              if (line.includes('POS PENERIMAAN') || line.includes('NOMOR TRANSAKSI') || line.includes('NAMA')) {
                headerIdx = r;
                break;
              }
            }

            const headerRow = (rows[headerIdx] || []).map(h => String(h || '').trim().toUpperCase());

            const mapCol = {
              noTrans: headerRow.findIndex(h => h.includes('NOMOR TRANSAKSI') || h.includes('NO TRANSAKSI')),
              date: headerRow.findIndex(h => h.includes('TANGGAL') || h.includes('DATE')),
              bank: headerRow.findIndex(h => h.includes('METODE') || h.includes('BANK')),
              pic: headerRow.findIndex(h => h.includes('PETUGAS') || h.includes('KASIR')),
              nis: headerRow.findIndex(h => h.includes('NIS') || h.includes('INDUK')),
              nama: headerRow.findIndex(h => h === 'NAMA' || h.includes('NAMA SISWA')),
              kelas: headerRow.findIndex(h => h.includes('KELAS') || h.includes('ROMBEL')),
              pos: headerRow.findIndex(h => h.includes('POS PENERIMAAN') || (h.includes('POS') && !h.includes('PENGELUARAN'))),
              tapel: headerRow.findIndex(h => h.includes('TAPEL') || h.includes('TAHUN AJARAN')),
              ketItem: headerRow.findIndex(h => h.includes('KETERANGAN ITEM') || h.includes('JENIS BIAYA') || h.includes('URAIAN')),
              amount: headerRow.findLastIndex(h => h.includes('PENERIMAAN') || h.includes('NOMINAL') || h.includes('JUMLAH') || h.includes('BAYAR'))
            };

            for (let i = headerIdx + 1; i < rows.length; i++) {
              const cols = rows[i];
              if (!cols || cols.length < 3) continue;

              const noTrans = mapCol.noTrans !== -1 ? String(cols[mapCol.noTrans] || '').trim() : String(cols[0] || '').trim();
              const pic = mapCol.pic !== -1 ? String(cols[mapCol.pic] || 'Kasir').trim() : 'Kasir';
              const bank = mapCol.bank !== -1 ? String(cols[mapCol.bank] || '').trim() : '';
              const nis = mapCol.nis !== -1 ? String(cols[mapCol.nis] || '').trim() : '';
              const senderOrStudent = mapCol.nama !== -1 ? String(cols[mapCol.nama] || '').trim() : '';
              const kelas = mapCol.kelas !== -1 ? String(cols[mapCol.kelas] || '').trim() : '';
              const pos = mapCol.pos !== -1 ? String(cols[mapCol.pos] || '').trim().toUpperCase() : '';
              const tapel = mapCol.tapel !== -1 ? String(cols[mapCol.tapel] || '').trim() : '';
              const ketItem = mapCol.ketItem !== -1 ? String(cols[mapCol.ketItem] || pos).trim() : pos;

              let rawAmountVal = mapCol.amount !== -1 ? cols[mapCol.amount] : cols[cols.length - 1];
              let amount = parseAmount(rawAmountVal);

              if (amount === 0) {
                for (let c = cols.length - 1; c >= 0; c--) {
                  const val = parseAmount(cols[c]);
                  if (val > 0) {
                    amount = val;
                    break;
                  }
                }
              }

              let parsedDate = mapCol.date !== -1 ? parseExcelDate(cols[mapCol.date]) : null;

              if (amount !== 0 && pos) {
                const tYear = parsedDate ? parsedDate.year : selectedYear.value;
                const tMonth = parsedDate ? parsedDate.month : selectedMonth.value;
                const routed = routeIncomeItem(pos, kelas, amount, ketItem, senderOrStudent);

                newItems.push({
                  id: `INC-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
                  date: parsedDate ? parsedDate.formatted : (noTrans || 'Kasir'),
                  day: parsedDate ? parsedDate.day : 1,
                  month: tMonth,
                  year: tYear,
                  monthKey: `${tYear}-${String(tMonth).padStart(2, '0')}`,
                  code: routed.kode,
                  pos: pos,
                  nis: nis,
                  senderOrStudent: senderOrStudent,
                  kelas: kelas,
                  tapel: tapel,
                  desc: `${ketItem} ${senderOrStudent ? `[${senderOrStudent}${kelas ? ` - ${kelas}` : ''}]` : ''}`.trim(),
                  pic: `${pic}${bank ? ` (${bank})` : ''}`.trim(),
                  type: 'PENERIMAAN',
                  amount: amount
                });
                loadedCount++;
              }
            }

            filesStatus.value.penerimaan = {
              uploaded: true,
              fileName: file.name,
              count: loadedCount
            };
          }

          rawTransactions.value.push(...newItems);

          if (filesStatus.value.tagihanDU.uploaded) {
            executeAutoSplitDaftarUlang();
          } else {
            transactions.value = [...rawTransactions.value];
          }

          uploadResultModal.value = {
            show: true,
            success: true,
            title: 'Upload Berhasil',
            fileName: file.name,
            loadedCount,
            skippedCount: 0,
            message: `Berhasil memuat ${loadedCount} transaksi ke dalam sistem.`
          };

          resolve({ loadedCount, skippedCount: 0 });
        } catch (err) {
          uploadResultModal.value = {
            show: true,
            success: false,
            title: 'Gagal Memproses File',
            fileName: file.name,
            loadedCount: 0,
            skippedCount: 0,
            message: err.message || 'Format file tidak sesuai.'
          };
          reject(err);
        } finally {
          isLoading.value = false;
        }
      };

      reader.onerror = (err) => {
        isLoading.value = false;
        reject(err);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  function getTransactionsForCode(code) {
    return filteredTransactionsByPeriod.value.filter(t => t.code === code);
  }

  function generateActivityReportWorkbook() {
    return buildActivityMatrixWorkbook({
      structure: REPORT_STRUCTURE,
      visibleMonths: visibleMonths.value,
      activePeriodLabel: activePeriodLabel.value,
      getCodeSum,
      getGroupTotal,
      sumPenerimaanRutin,
      sumPenerimaanTidakRutin,
      grandTotalIncome,
      sumBebanRutin,
      sumBebanTidakRutin,
      grandTotalExpense,
      surplusDeficit,
      filteredTransactions: filteredTransactionsByPeriod.value,
      masterCoaList: MASTER_COA_LIST
    });
  }

  function exportFullExcel() {
    const wb = generateActivityReportWorkbook();
    const cleanLabel = activePeriodLabel.value.replace(/[\/\s:]+/g, '_');
    XLSX.writeFile(wb, `Laporan_Aktivitas_Keuangan_PIT_${cleanLabel}.xlsx`);
  }

  function exportDaftarUlangExcel() {
    const wb = buildDaftarUlangFullExcel(fullBreakdownRows.value, activePeriodLabel.value);
    XLSX.writeFile(wb, `Rincian_Daftar_Ulang_Semua_Santri_PIT_${activePeriodLabel.value.replace(/[\/\s:]+/g, '_')}.xlsx`);
  }

  async function downloadFullReportBundle() {
    isLoading.value = true;
    loadingStatus.value = 'Mempersiapkan paket laporan ZIP...';
    try {
      const activityWb = generateActivityReportWorkbook();
      const duWb = fullBreakdownRows.value.length > 0
        ? buildDaftarUlangFullExcel(fullBreakdownRows.value, activePeriodLabel.value)
        : null;

      const fullState = {
        appVersion: '3.0.0',
        exportedAt: new Date().toISOString(),
        periodMode: periodMode.value,
        selectedMonth: selectedMonth.value,
        selectedYear: selectedYear.value,
        selectedAcademicYear: selectedAcademicYear.value,
        rawTransactions: rawTransactions.value,
        transactions: transactions.value,
        studentMasterList: studentMasterList.value,
        presets: presets.value,
        filesStatus: filesStatus.value
      };

      await downloadReportBundleZip({
        activityWorkbook: activityWb,
        duWorkbook: duWb,
        fullStateJson: fullState,
        periodLabel: activePeriodLabel.value
      });
    } catch (err) {
      console.error(err);
      alert('Gagal mendownload ZIP: ' + err.message);
    } finally {
      isLoading.value = false;
    }
  }

  function restoreSystemFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data && data.transactions && Array.isArray(data.transactions)) {
            rawTransactions.value = data.rawTransactions || data.transactions;
            transactions.value = data.transactions;
            if (data.studentMasterList) studentMasterList.value = data.studentMasterList;
            if (data.presets) savePresets(data.presets);
            if (data.filesStatus) filesStatus.value = data.filesStatus;
            if (data.periodMode) periodMode.value = data.periodMode;
            if (data.selectedMonth) selectedMonth.value = data.selectedMonth;
            if (data.selectedYear) selectedYear.value = data.selectedYear;
            if (data.selectedAcademicYear) selectedAcademicYear.value = data.selectedAcademicYear;
            resolve(data);
          } else {
            throw new Error('Format file backup JSON tidak cocok.');
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  }

  return {
    periodMode,
    selectedMonth,
    selectedYear,
    selectedAcademicYear,
    hideEmptyMonthColumns,
    MONTH_NAMES,
    MONTH_NAMES_SHORT,
    activePeriodLabel,
    visibleMonths,
    availableMonthsInDataset,
    transactions,
    filteredTransactionsByPeriod,
    filesStatus,
    activeTab,
    selectedAccountDetail,
    isLoading,
    loadingStatus,
    uploadResultModal,
    REPORT_STRUCTURE,
    MASTER_COA_LIST,
    presets,
    studentMasterList,
    fullBreakdownRows,
    isSplitModalOpen,
    targetSplitTransaction,
    openSplitModal,
    handleSaveSplit,
    isReassignModalOpen,
    reassignTargetIds,
    singleReassignTransaction,
    openReassignModal,
    openMassReassignModal,
    handleConfirmReassign,
    deleteTransaction,
    deleteMassTransactions,
    getTransactionsForCode,
    getCodeSum,
    getGroupTotal,
    sumPenerimaanRutin,
    sumPenerimaanTidakRutin,
    grandTotalIncome,
    sumBebanRutin,
    sumBebanTidakRutin,
    grandTotalExpense,
    surplusDeficit,
    processExcelFile,
    executeAutoSplitDaftarUlang,
    setDetailAccount,
    backToReport,
    clearAllData,
    exportFullExcel,
    exportDaftarUlangExcel,
    downloadFullReportBundle,
    restoreSystemFromJSON
  };
}