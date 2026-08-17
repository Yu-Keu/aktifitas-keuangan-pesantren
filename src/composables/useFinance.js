import { ref, computed, nextTick } from 'vue';
import * as XLSX from 'xlsx';
import { REPORT_STRUCTURE } from '../constants/reportStructure.js';
import { POS_MAPPING } from '../constants/posMapping.js';
import { routeIncomeItem } from '../utils/classClassifier.js';
import { parseExcelDate, parseAmount } from '../utils/formatters.js';

export function useFinance() {
  // =========================================================================
  // 1. STATE DASAR & NAVIGASI TAB
  // =========================================================================
  const activeTab = ref('report');
  const isLoading = ref(false);
  const loadingStatus = ref('');
  const savedScrollPosition = ref(0);

  // Modal Notifikasi Upload (Pengganti Alert)
  const uploadResultModal = ref({
    show: false,
    success: true,
    title: '',
    fileName: '',
    loadedCount: 0,
    skippedCount: 0,
    message: ''
  });

  // =========================================================================
  // 2. PERIODE LAPORAN (BULAN & TAHUN)
  // =========================================================================
  const now = new Date();
  const selectedMonth = ref(now.getMonth() + 1); // 1 - 12
  const selectedYear = ref(now.getFullYear());

  const MONTH_NAMES = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const activePeriodLabel = computed(() => {
    return `${MONTH_NAMES[selectedMonth.value]} ${selectedYear.value}`;
  });

  // =========================================================================
  // 3. PENYIMPANAN DATA TRANSAKSI
  // =========================================================================
  const transactions = ref([]);
  const selectedAccountDetail = ref(null);

  // Navigasi ke Rincian Akun (Menyimpan posisi scroll)
  function setDetailAccount(item) {
    savedScrollPosition.value = window.pageYOffset || document.documentElement.scrollTop || 0;
    selectedAccountDetail.value = item;
    activeTab.value = 'detail';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Navigasi Kembali ke Laporan (Scroll kembali ke baris semula secara instan)
  function backToReport() {
    activeTab.value = 'report';
    nextTick(() => {
      window.scrollTo({ top: savedScrollPosition.value, behavior: 'instant' });
    });
  }

  // Bersihkan Semua Data
  function clearAllData() {
    if (confirm('Kosongkan semua data transaksi yang sudah dimuat?')) {
      transactions.value = [];
      selectedAccountDetail.value = null;
    }
  }

  // =========================================================================
  // 4. PARSER UNIVERSAL EXCEL (.xlsx / .csv)
  // =========================================================================
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
            // Target Sheet khusus 'Kas Kecil'
            const kasKecilSheetName = workbook.SheetNames.find(
              name => name.trim().toLowerCase().replace(/\s+/g, '') === 'kaskecil'
            );
            worksheet = workbook.Sheets[kasKecilSheetName || workbook.SheetNames[0]];
          } else {
            worksheet = workbook.Sheets[workbook.SheetNames[0]];
          }

          if (!worksheet) throw new Error('Sheet data tidak ditemukan di dalam file Excel.');

          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          let loadedCount = 0;
          let skippedCount = 0;
          const newItems = [];

          // -----------------------------------------------------------------
          // A. PARSER MONITORING PENGELUARAN (KAS KECIL)
          // -----------------------------------------------------------------
          if (type === 'pengeluaran') {
            let headerIdx = 3;
            let colMap = {
              kodPer: 0,   // Kolom A (KOD PER)
              tanggal: 1,  // Kolom B (TANGGAL)
              kode: 2,     // Kolom C (KODE)
              jenjang: 3,  // Kolom D (NAMA JENJANG)
              uraian: 5,   // Kolom F (URAIAN)
              nama: 6,     // Kolom G (NAMA PIC)
              kredit: 12   // Kolom M (KREDIT - Nominal Pengeluaran)
            };

            // Scan baris 1 s/d 10 untuk mendeteksi header secara dinamis
            for (let r = 0; r < Math.min(rows.length, 10); r++) {
              const row = rows[r] || [];
              const line = row.join(' ').toUpperCase();
              if (line.includes('TANGGAL') || line.includes('KOD PER') || line.includes('URAIAN')) {
                headerIdx = r;
                row.forEach((cell, idx) => {
                  const c = String(cell || '').trim().toUpperCase();
                  if (c.includes('KOD') && c.includes('PER')) colMap.kodPer = idx;
                  else if (c === 'TANGGAL' || c.includes('TGL')) colMap.tanggal = idx;
                  else if (c === 'KODE') colMap.kode = idx;
                  else if (c.includes('JENJANG') || c.includes('NAMA AKUN')) colMap.jenjang = idx;
                  else if (c.includes('URAIAN') || c.includes('KETERANGAN')) colMap.uraian = idx;
                  else if (c === 'NAMA' || c.includes('PENERIMA')) colMap.nama = idx;
                  else if (c.includes('KREDIT') || c.includes('CREDIT')) colMap.kredit = idx;
                });
                break;
              }
            }

            // Baca Baris Data
            for (let i = headerIdx + 1; i < rows.length; i++) {
              const cols = rows[i];
              if (!cols || cols.length < 3) continue;

              // Ambil Kolom A (KOD PER), jika kosong gunakan Kolom C (KODE)
              const colA = String(cols[colMap.kodPer] || cols[0] || '').trim();
              const colC = String(cols[colMap.kode] || cols[2] || '').trim();
              const rawCode = (colA !== '' ? colA : colC).toUpperCase().replace(/\s+/g, '');

              // Lewati transaksi kas internal (Kode 1: Kas Tunai, Kode 2: Kas Bank)
              if (!rawCode || rawCode === '1' || rawCode === '2') continue;

              const parsedDate = parseExcelDate(cols[colMap.tanggal] || cols[1]);
              const rawDesc = String(cols[colMap.uraian] || cols[5] || cols[4] || cols[3] || `Pengeluaran ${rawCode}`).trim();
              const pic = String(cols[colMap.nama] || cols[6] || '-').trim();

              // KUNCI: Ambil nominal dari Kolom M (KREDIT), BUKAN Kolom N (SALDO KAS)
              let rawKredit = cols[colMap.kredit] !== undefined && cols[colMap.kredit] !== ''
                ? cols[colMap.kredit]
                : cols[12];

              let amount = Math.abs(parseAmount(rawKredit));

              // Fallback jika kolom M kosong (misal posisi geser 1 kolom ke L)
              if (amount === 0 && cols[11] !== undefined) {
                amount = Math.abs(parseAmount(cols[11]));
              }

              if (amount > 0) {
                // Filter Periode (Bulan & Tahun)
                if (parsedDate && (parsedDate.month !== selectedMonth.value || parsedDate.year !== selectedYear.value)) {
                  skippedCount++;
                  continue;
                }

                newItems.push({
                  id: `EXP-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
                  date: parsedDate ? parsedDate.formatted : String(cols[colMap.tanggal] || cols[1] || ''),
                  code: rawCode,
                  pos: String(cols[colMap.jenjang] || cols[3] || 'Monitoring Kas Kecil').trim(),
                  desc: rawDesc,
                  pic: pic,
                  type: 'PENGELUARAN',
                  amount: amount
                });
                loadedCount++;
              }
            }
          } 
          // -----------------------------------------------------------------
          // B. PARSER PENERIMAAN SISWA & UMUM
          // -----------------------------------------------------------------
          else if (type === 'penerimaan') {
            let headerIdx = 0;
            for (let r = 0; r < Math.min(rows.length, 15); r++) {
              const line = (rows[r] || []).join(' ').toUpperCase();
              if (line.includes('POS PENERIMAAN') || line.includes('NOMOR TRANSAKSI')) {
                headerIdx = r;
                break;
              }
            }

            for (let i = headerIdx + 1; i < rows.length; i++) {
              const cols = rows[i];
              if (!cols || cols.length < 5) continue;

              const parsedDate = parseExcelDate(cols[1]);
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

                let finalCode = 'A26';

                // 1. ROUTING KHUSUS KAFALAH YATIM (Yayasan vs Non-Yayasan)
                if (
                  pos.includes('KAFALAH') ||
                  pos.includes('YATIM') ||
                  ketItem.toUpperCase().includes('KAFALAH')
                ) {
                  const checkIdentity = `${senderOrStudent} ${ketItem} ${pos} ${String(cols[3] || '')}`.toUpperCase();
                  if (checkIdentity.includes('YAYASAN') || checkIdentity.includes('LAJNAH')) {
                    finalCode = 'A171'; // Dari Yayasan Lajnah
                  } else {
                    finalCode = 'A172'; // Dari Non-Yayasan
                  }
                }
                // 2. ROUTING POS BERDASARKAN KELAS & JENJANG (PAUD, MI, MTS, MA / Kelas 13 Khidmah)
                else {
                  const routed = routeIncomeItem(pos, kelas, amount, ketItem);
                  finalCode = routed.kode;
                }

                newItems.push({
                  id: `INC-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
                  date: parsedDate ? parsedDate.formatted : String(cols[1] || ''),
                  code: finalCode,
                  pos: pos,
                  desc: `${ketItem} ${senderOrStudent ? `[${senderOrStudent}${kelas ? ` - ${kelas}` : ''}]` : ''}`.trim(),
                  pic: String(cols[3] || 'Kasir/Bank'),
                  type: 'PENERIMAAN',
                  amount: amount
                });
                loadedCount++;
              }
            }
          }

          transactions.value.push(...newItems);

          // Tampilkan Modal Hasil Upload
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

  // =========================================================================
  // 5. KALKULASI & AGREGASI LAPORAN HIERARKIS
  // =========================================================================
  function getTransactionsForCode(code) {
    return transactions.value.filter(t => t.code === code);
  }

  function getSumForCode(code) {
    return transactions.value
      .filter(t => t.code === code)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  // A.1 Penerimaan Rutin
  const sumPenerimaanRutin = computed(() => {
    return (REPORT_STRUCTURE.penerimaanRutin.groups || []).reduce(
      (acc, group) => acc + group.items.reduce((s, i) => s + getSumForCode(i.code), 0), 0
    );
  });

  // A.2 Penerimaan Tidak Rutin
  const sumPenerimaanTidakRutin = computed(() => {
    return (REPORT_STRUCTURE.penerimaanTidakRutin.groups || []).reduce(
      (acc, group) => acc + group.items.reduce((s, i) => s + getSumForCode(i.code), 0), 0
    );
  });

  // TOTAL PENERIMAAN (A)
  const grandTotalIncome = computed(() => {
    return sumPenerimaanRutin.value + sumPenerimaanTidakRutin.value;
  });

  // B.1 Beban Rutin
  const sumBebanRutin = computed(() => {
    return (REPORT_STRUCTURE.bebanRutin.groups || []).reduce(
      (acc, group) => acc + group.items.reduce((s, i) => s + getSumForCode(i.code), 0), 0
    );
  });

  // B.2 Beban Tidak Rutin
  const sumBebanTidakRutin = computed(() => {
    return (REPORT_STRUCTURE.bebanTidakRutin.groups || []).reduce(
      (acc, group) => acc + group.items.reduce((s, i) => s + getSumForCode(i.code), 0), 0
    );
  });

  // TOTAL BEBAN (B)
  const grandTotalExpense = computed(() => {
    return sumBebanRutin.value + sumBebanTidakRutin.value;
  });

  // SURPLUS / (DEFISIT)
  const surplusDeficit = computed(() => {
    return grandTotalIncome.value - grandTotalExpense.value;
  });

  // =========================================================================
  // 6. RETURN API
  // =========================================================================
  return {
    transactions,
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
    clearAllData
  };
}