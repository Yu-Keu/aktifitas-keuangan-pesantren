import { ref, computed, nextTick } from 'vue';
import * as XLSX from 'xlsx';
import { REPORT_STRUCTURE } from '../constants/reportStructure.js';
import { MASTER_COA_LIST } from '../constants/coa.js';
import { routeIncomeItem } from '../utils/classClassifier.js';
import { parseExcelDate, parseAmount, formatIDR } from '../utils/formatters.js';

export function useFinance() {
  const activeTab = ref('report');
  const isLoading = ref(false);
  const loadingStatus = ref('');
  const savedScrollPosition = ref(0);

  const filesStatus = ref({
    pengeluaran: { uploaded: false, fileName: '', count: 0 },
    penerimaan: { uploaded: false, fileName: '', count: 0 }
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

  // Modal State
  const isSplitModalOpen = ref(false);
  const targetSplitTransaction = ref(null);

  const isReassignModalOpen = ref(false);
  const reassignTargetIds = ref([]);
  const singleReassignTransaction = ref(null);

  // Periode Laporan
  const now = new Date();
  const selectedMonth = ref(now.getMonth() + 1);
  const selectedYear = ref(now.getFullYear());

  const MONTH_NAMES = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const activePeriodLabel = computed(() => `${MONTH_NAMES[selectedMonth.value]} ${selectedYear.value}`);

  // Transaksi
  const transactions = ref([]);
  const selectedAccountDetail = ref(null);

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
      transactions.value = [];
      selectedAccountDetail.value = null;
      filesStatus.value.pengeluaran = { uploaded: false, fileName: '', count: 0 };
      filesStatus.value.penerimaan = { uploaded: false, fileName: '', count: 0 };
    }
  }

  // REASSIGN POS (MODAL SEARCH)
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
    }
  }

  function deleteMassTransactions(transactionIds) {
    if (!transactionIds || transactionIds.length === 0) return;
    if (confirm(`Hapus ${transactionIds.length} transaksi terpilih?`)) {
      transactions.value = transactions.value.filter(t => !transactionIds.includes(t.id));
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

  // PARSER EXCEL 16-KOLOM STANDAR
  async function processExcelFile(file, type) {
    isLoading.value = true;
    loadingStatus.value = `Membaca file ${file.name}...`;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          let worksheet = null;
          if (type === 'pengeluaran') {
            const kasKecilSheetName = workbook.SheetNames.find(
              name => name.trim().toLowerCase().replace(/\s+/g, '') === 'kaskecil'
            );
            worksheet = workbook.Sheets[kasKecilSheetName || workbook.SheetNames[0]];
          } else {
            worksheet = workbook.Sheets[workbook.SheetNames[0]];
          }

          if (!worksheet) throw new Error('Sheet data tidak ditemukan di dalam file.');

          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          let loadedCount = 0;
          let skippedCount = 0;
          const newItems = [];

          // ---------------------------------------------------------
          // A. PENGELUARAN (KAS KECIL)
          // ---------------------------------------------------------
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
                if (parsedDate && (parsedDate.month !== selectedMonth.value || parsedDate.year !== selectedYear.value)) {
                  skippedCount++;
                  continue;
                }

                newItems.push({
                  id: `EXP-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
                  date: parsedDate ? parsedDate.formatted : String(cols[1] || ''),
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
          // ---------------------------------------------------------
          // B. PENERIMAAN SISWA (FORMAT ASLI 16 KOLOM)
          // ---------------------------------------------------------
          else if (type === 'penerimaan') {
            let headerIdx = 0;
            for (let r = 0; r < Math.min(rows.length, 15); r++) {
              const line = (rows[r] || []).join(' ').toUpperCase();
              if (line.includes('POS PENERIMAAN') || line.includes('NOMOR TRANSAKSI') || line.includes('NAMA SISWA')) {
                headerIdx = r;
                break;
              }
            }

            for (let i = headerIdx + 1; i < rows.length; i++) {
              const cols = rows[i];
              if (!cols || cols.length < 5) continue;

              const parsedDate = parseExcelDate(cols[1]);
              const pic = String(cols[3] || 'Kasir/Bank').trim();
              const senderOrStudent = String(cols[6] || '').trim();
              const kelas = String(cols[8] || '').trim();
              const pos = String(cols[9] || '').trim().toUpperCase();
              const ketItem = String(cols[14] || cols[13] || pos).trim();
              const amount = parseAmount(cols[15]);

              if (amount !== 0 && pos) {
                if (parsedDate && (parsedDate.month !== selectedMonth.value || parsedDate.year !== selectedYear.value)) {
                  skippedCount++;
                  continue;
                }

                const routed = routeIncomeItem(pos, kelas, amount, ketItem, senderOrStudent);

                newItems.push({
                  id: `INC-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
                  date: parsedDate ? parsedDate.formatted : String(cols[1] || ''),
                  code: routed.kode,
                  pos: pos,
                  desc: `${ketItem} ${senderOrStudent ? `[${senderOrStudent}${kelas ? ` - ${kelas}` : ''}]` : ''}`.trim(),
                  pic: pic,
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

          transactions.value.push(...newItems);

          uploadResultModal.value = {
            show: true,
            success: true,
            title: 'Upload Berhasil',
            fileName: file.name,
            loadedCount,
            skippedCount,
            message: `Berhasil memuat ${loadedCount} transaksi ke dalam periode ${activePeriodLabel.value}.`
          };

          resolve({ loadedCount, skippedCount });
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

  // KALKULASI & EXPORT
  function getTransactionsForCode(code) {
    return transactions.value.filter(t => t.code === code);
  }

  function getSumForCode(code) {
    return transactions.value
      .filter(t => t.code === code)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }

  const sumPenerimaanRutin = computed(() => {
    return (REPORT_STRUCTURE.penerimaanRutin.groups || []).reduce(
      (acc, group) => acc + group.items.reduce((s, i) => s + getSumForCode(i.code), 0), 0
    );
  });

  const sumPenerimaanTidakRutin = computed(() => {
    return (REPORT_STRUCTURE.penerimaanTidakRutin.groups || []).reduce(
      (acc, group) => acc + group.items.reduce((s, i) => s + getSumForCode(i.code), 0), 0
    );
  });

  const grandTotalIncome = computed(() => sumPenerimaanRutin.value + sumPenerimaanTidakRutin.value);

  const sumBebanRutin = computed(() => {
    return (REPORT_STRUCTURE.bebanRutin.groups || []).reduce(
      (acc, group) => acc + group.items.reduce((s, i) => s + getSumForCode(i.code), 0), 0
    );
  });

  const sumBebanTidakRutin = computed(() => {
    return (REPORT_STRUCTURE.bebanTidakRutin.groups || []).reduce(
      (acc, group) => acc + group.items.reduce((s, i) => s + getSumForCode(i.code), 0), 0
    );
  });

  const grandTotalExpense = computed(() => sumBebanRutin.value + sumBebanTidakRutin.value);
  const surplusDeficit = computed(() => grandTotalIncome.value - grandTotalExpense.value);

  function exportFullExcel() {
    const wb = XLSX.utils.book_new();

    const summaryRows = [
      ['LAPORAN AKTIFITAS KEUANGAN'],
      ['PESANTREN IBNU TAIMIYAH BOGOR'],
      [`Periode: ${activePeriodLabel.value}`],
      [''],
      ['Kategori / Pos Akun', 'Kode', 'Rincian Pos', 'Rincian (Rp)', 'Subtotal (Rp)'],
      ['A. PENERIMAAN', '', '', '', ''],
      ['A.1 PENERIMAAN RUTIN', '', '', '', '']
    ];

    function appendGroups(groups) {
      groups.forEach(g => {
        if (g.items.length === 1) {
          const item = g.items[0];
          const val = getSumForCode(item.code);
          summaryRows.push([g.name, item.code, item.desc, val, val]);
        } else {
          const groupTotal = g.items.reduce((s, it) => s + getSumForCode(it.code), 0);
          summaryRows.push([g.name, '', '', '', groupTotal]);
          g.items.forEach(it => {
            const itVal = getSumForCode(it.code);
            summaryRows.push(['', it.code, it.desc, itVal, '']);
          });
        }
      });
    }

    appendGroups(REPORT_STRUCTURE.penerimaanRutin.groups);
    summaryRows.push(['Total Penerimaan Rutin', '', '', '', sumPenerimaanRutin.value]);
    summaryRows.push(['A.2 PENERIMAAN TIDAK RUTIN', '', '', '', '']);
    appendGroups(REPORT_STRUCTURE.penerimaanTidakRutin.groups);
    summaryRows.push(['Total Penerimaan Tidak Rutin', '', '', '', sumPenerimaanTidakRutin.value]);
    summaryRows.push(['TOTAL PENERIMAAN (A)', '', '', grandTotalIncome.value, grandTotalIncome.value]);
    summaryRows.push(['']);

    summaryRows.push(['B. BEBAN', '', '', '', '']);
    summaryRows.push(['B.1 BEBAN RUTIN', '', '', '', '']);
    appendGroups(REPORT_STRUCTURE.bebanRutin.groups);
    summaryRows.push(['Total Beban Rutin', '', '', '', sumBebanRutin.value]);
    summaryRows.push(['B.2 BEBAN TIDAK RUTIN', '', '', '', '']);
    appendGroups(REPORT_STRUCTURE.bebanTidakRutin.groups);
    summaryRows.push(['Total Beban Tidak Rutin', '', '', '', sumBebanTidakRutin.value]);
    summaryRows.push(['TOTAL BEBAN (B)', '', '', grandTotalExpense.value, grandTotalExpense.value]);
    summaryRows.push(['']);
    summaryRows.push(['SURPLUS (DEFISIT) BULAN INI', '', '', surplusDeficit.value, surplusDeficit.value]);

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Laporan Aktivitas');

    const activeCodes = [...new Set(transactions.value.map(t => t.code))].filter(Boolean);
    activeCodes.forEach(code => {
      const coaMeta = MASTER_COA_LIST.find(c => c.kode === code) || { nama: 'Pos Akun' };
      const items = getTransactionsForCode(code);
      if (items.length === 0) return;

      const sheetData = [
        [`RINCIAN TRANSAKSI: [${code}] ${coaMeta.nama}`],
        [`Periode: ${activePeriodLabel.value} | Total: ${formatIDR(getSumForCode(code))}`],
        [''],
        ['No', 'Tanggal', 'Uraian Transaksi', 'Petugas / PIC', 'Pos Asal', 'Tipe', 'Nominal (Rp)']
      ];

      items.forEach((it, idx) => {
        sheetData.push([
          idx + 1,
          it.date,
          it.desc,
          it.pic,
          it.pos,
          it.type,
          it.amount
        ]);
      });

      sheetData.push(['', '', '', '', 'Total Pos:', '', getSumForCode(code)]);

      const wsDetail = XLSX.utils.aoa_to_sheet(sheetData);
      let sheetName = `${code}_${coaMeta.nama}`.replace(/[:\\/?*\[\]]/g, '').substring(0, 30);
      XLSX.utils.book_append_sheet(wb, wsDetail, sheetName);
    });

    const fileName = `Laporan_Keuangan_PIT_${selectedMonth.value}_${selectedYear.value}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  return {
    transactions,
    filesStatus,
    selectedMonth,
    selectedYear,
    MONTH_NAMES,
    activePeriodLabel,
    activeTab,
    selectedAccountDetail,
    isLoading,
    loadingStatus,
    uploadResultModal,
    REPORT_STRUCTURE,
    MASTER_COA_LIST,
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
    getSumForCode,
    sumPenerimaanRutin,
    sumPenerimaanTidakRutin,
    grandTotalIncome,
    sumBebanRutin,
    sumBebanTidakRutin,
    grandTotalExpense,
    surplusDeficit,
    processExcelFile,
    setDetailAccount,
    backToReport,
    clearAllData,
    exportFullExcel
  };
}