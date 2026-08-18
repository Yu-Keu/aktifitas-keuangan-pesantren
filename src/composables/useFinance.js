// src/composables/useFinance.js
import { ref, computed, nextTick } from 'vue';
import * as XLSX from 'xlsx';
import { REPORT_STRUCTURE } from '../constants/reportStructure.js';
import { MASTER_COA_LIST } from '../constants/coa.js';
import { routeIncomeItem } from '../utils/classClassifier.js';
import { parseExcelDate, parseAmount, formatIDR } from '../utils/formatters.js';
import { useDaftarUlang } from './useDaftarUlang.js';
import { buildDaftarUlangFullExcel, downloadReportBundleZip } from '../utils/exportBundle.js';

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
      studentMasterList.value = [];
      selectedAccountDetail.value = null;
      filesStatus.value.pengeluaran = { uploaded: false, fileName: '', count: 0 };
      filesStatus.value.penerimaan = { uploaded: false, fileName: '', count: 0 };
      filesStatus.value.tagihanDU = { uploaded: false, fileName: '', count: 0 };
    }
  }

  // REASSIGN POS
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

  // AUTO-SPLIT WATERFALL OTOMATIS
  function executeAutoSplitDaftarUlang() {
    const result = runWaterfallSplit(transactions.value);
    transactions.value = result.updatedTransactions;
    return result;
  }

  // PARSER EXCEL DINAMIS & EKSEKUSI OTOMATIS
  async function processExcelFile(file, type) {
    // Validasi Urutan Upload: Penerimaan Harus Sebelum Tagihan Daftar Ulang
    if (type === 'tagihan_du' && !filesStatus.value.penerimaan.uploaded) {
      alert('Perhatian: Harap upload File Penerimaan (16 Kolom) terlebih dahulu agar data transaksi kasir dapat otomatis dicocokkan dan di-split.');
      return;
    }

    isLoading.value = true;
    loadingStatus.value = `Membaca file ${file.name}...`;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // ---------------------------------------------------------
          // A. FILE TAGIHAN DAFTAR ULANG -> LANGSUNG AUTO-SPLIT OTOMATIS
          // ---------------------------------------------------------
          if (type === 'tagihan_du') {
            const ws = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            const count = parseTagihanSheet(rows);

            filesStatus.value.tagihanDU = {
              uploaded: true,
              fileName: file.name,
              count
            };

            // EKSEKUSI LANGSUNG AUTO SPLIT TANPA TOMBOL
            const splitRes = executeAutoSplitDaftarUlang();

            uploadResultModal.value = {
              show: true,
              success: true,
              title: 'Master Tagihan Terpasang & Ter-Split',
              fileName: file.name,
              loadedCount: count,
              skippedCount: splitRes.skippedPastYearCount,
              message: `Berhasil memuat ${count} data santri dan otomatis memecah ${splitRes.splitCount} transaksi Daftar Ulang ke pos masing-masing!`
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
          let skippedCount = 0;
          const newItems = [];

          // ---------------------------------------------------------
          // B. PENGELUARAN (KAS KECIL)
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
          // C. PENERIMAAN 16 KOLOM
          // ---------------------------------------------------------
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
              date: headerRow.findIndex(h => h.includes('TANGGAL') || h.includes('DATE') || h.includes('WAKTU')),
              bank: headerRow.findIndex(h => h.includes('METODE') || h.includes('BANK') || h.includes('KAS')),
              pic: headerRow.findIndex(h => h.includes('PETUGAS') || h.includes('KASIR') || h.includes('USER')),
              nis: headerRow.findIndex(h => h.includes('NIS') || h.includes('INDUK')),
              nama: headerRow.findIndex(h => h.includes('NAMA')),
              kelas: headerRow.findIndex(h => h.includes('KELAS') || h.includes('ROMBEL')),
              pos: headerRow.findIndex(h => h.includes('POS PENERIMAAN') || (h.includes('POS') && !h.includes('PENGELUARAN'))),
              tapel: headerRow.findIndex(h => h.includes('TAPEL') || h.includes('TAHUN AJARAN')),
              ketItem: headerRow.findIndex(h => h.includes('KETERANGAN ITEM') || h.includes('JENIS BIAYA') || h.includes('URAIAN') || h.includes('KETERANGAN')),
              amount: headerRow.findLastIndex(h => h.includes('PENERIMAAN') || h.includes('NOMINAL') || h.includes('JUMLAH') || h.includes('BAYAR') || h.includes('TOTAL'))
            };

            for (let i = headerIdx + 1; i < rows.length; i++) {
              const cols = rows[i];
              if (!cols || cols.length < 3) continue;

              const noTrans = mapCol.noTrans !== -1 ? String(cols[mapCol.noTrans] || '').trim() : String(cols[0] || '').trim();
              const pic = mapCol.pic !== -1 ? String(cols[mapCol.pic] || 'Kasir/Bank').trim() : 'Kasir/Bank';
              const bank = mapCol.bank !== -1 ? String(cols[mapCol.bank] || '').trim() : '';
              const nis = mapCol.nis !== -1 ? String(cols[mapCol.nis] || '').trim() : '';
              const senderOrStudent = mapCol.nama !== -1 ? String(cols[mapCol.nama] || '').trim() : String(cols[4] || cols[5] || '').trim();
              const kelas = mapCol.kelas !== -1 ? String(cols[mapCol.kelas] || '').trim() : String(cols[6] || cols[7] || '').trim();
              const pos = mapCol.pos !== -1 ? String(cols[mapCol.pos] || '').trim().toUpperCase() : String(cols[7] || cols[8] || '').trim().toUpperCase();
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
              if (!parsedDate && noTrans) {
                const dateMatch = noTrans.match(/(?:SIS|TRX|TX)?(\d{4})(\d{2})(\d{2})/i);
                if (dateMatch) {
                  const yr = parseInt(dateMatch[1], 10);
                  const mo = parseInt(dateMatch[2], 10);
                  const dy = parseInt(dateMatch[3], 10);
                  if (yr >= 2020 && yr <= 2035 && mo >= 1 && mo <= 12 && dy >= 1 && dy <= 31) {
                    parsedDate = {
                      year: yr,
                      month: mo,
                      day: dy,
                      formatted: `${String(dy).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${yr}`
                    };
                  }
                }
              }

              if (amount !== 0 && pos) {
                if (parsedDate && (parsedDate.month !== selectedMonth.value || parsedDate.year !== selectedYear.value)) {
                  skippedCount++;
                  continue;
                }

                const routed = routeIncomeItem(pos, kelas, amount, ketItem, senderOrStudent);

                newItems.push({
                  id: `INC-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
                  date: parsedDate ? parsedDate.formatted : (noTrans || 'Kasir'),
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

          transactions.value.push(...newItems);

          // Jika sebelumnya master tagihan sudah terpasang, langsung lakukan split otomatis
          if (filesStatus.value.tagihanDU.uploaded) {
            executeAutoSplitDaftarUlang();
          }

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

  // KALKULASI
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

  // BUILD WORKBOOK LAPORAN AKTIVITAS
  function generateActivityReportWorkbook() {
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

    return wb;
  }

  // 1. Download Standalone Excel Laporan
  function exportFullExcel() {
    const wb = generateActivityReportWorkbook();
    const fileName = `Laporan_Keuangan_PIT_${selectedMonth.value}_${selectedYear.value}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // 2. Download Standalone Excel Rincian Daftar Ulang Semua Santri
  function exportDaftarUlangExcel() {
    const wb = buildDaftarUlangFullExcel(fullBreakdownRows.value, activePeriodLabel.value);
    XLSX.writeFile(wb, `Rincian_Daftar_Ulang_Semua_Santri_PIT_${activePeriodLabel.value.replace(/\s+/g, '_')}.xlsx`);
  }

  // 3. Download Bundle Arsip Laporan Lengkap (.zip)
  async function downloadFullReportBundle() {
    isLoading.value = true;
    loadingStatus.value = 'Mempersiapkan paket laporan ZIP...';
    try {
      const activityWb = generateActivityReportWorkbook();
      const duWb = fullBreakdownRows.value.length > 0
        ? buildDaftarUlangFullExcel(fullBreakdownRows.value, activePeriodLabel.value)
        : null;

      const fullState = {
        appVersion: '2.0.0',
        exportedAt: new Date().toISOString(),
        period: { month: selectedMonth.value, year: selectedYear.value },
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

  // 4. Restore Full State dari File JSON
  function restoreSystemFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data && data.transactions && Array.isArray(data.transactions)) {
            transactions.value = data.transactions;
            if (data.studentMasterList) studentMasterList.value = data.studentMasterList;
            if (data.presets) savePresets(data.presets);
            if (data.filesStatus) filesStatus.value = data.filesStatus;
            if (data.period) {
              selectedMonth.value = data.period.month;
              selectedYear.value = data.period.year;
            }
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
    getSumForCode,
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