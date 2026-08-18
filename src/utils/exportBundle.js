// src/utils/exportBundle.js
import * as XLSX from 'xlsx';
import { formatIDR } from './formatters.js';

// 1. Ekspor Rincian Daftar Ulang Seluruh Santri
export function buildDaftarUlangFullExcel(breakdownRows = [], periodLabel = '') {
  const wsData = [
    ['DATA RINCIAN DAFTAR ULANG SANTRI'],
    [`PESANTREN IBNU TAIMIYAH BOGOR - ${periodLabel}`],
    [''],
    ['No', 'No. Induk', 'Nama Siswa', 'Jenis Kelamin', 'Kelas', 'Pos', 'Nominal Pembayaran']
  ];

  let totalAmount = 0;
  breakdownRows.forEach((r, idx) => {
    totalAmount += Number(r.amount) || 0;
    wsData.push([
      idx + 1,
      r.nis,
      r.nama,
      r.jk,
      r.kelas,
      r.posName,
      r.amount
    ]);
  });

  wsData.push(['', '', '', '', 'TOTAL ALOKASI PEMBAYARAN:', '', totalAmount]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Rincian Daftar Ulang');
  return wb;
}

// 2. Ekspor Laporan Aktivitas Matriks Bulanan & Single Bulan
export function buildActivityMatrixWorkbook({
  structure,
  visibleMonths = [],
  activePeriodLabel = '',
  getCodeSum,
  getGroupTotal,
  sumPenerimaanRutin,
  sumPenerimaanTidakRutin,
  grandTotalIncome,
  sumBebanRutin,
  sumBebanTidakRutin,
  grandTotalExpense,
  surplusDeficit,
  filteredTransactions = [],
  masterCoaList = []
}) {
  const isMultiMonth = visibleMonths.length > 1;
  const wb = XLSX.utils.book_new();

  // Header Table
  const tableHeader = ['Kategori / Pos Akun', 'Kode', 'Rincian Pos'];
  if (isMultiMonth) {
    visibleMonths.forEach(m => tableHeader.push(m.label));
    tableHeader.push('Total Konsolidasi');
  } else {
    tableHeader.push('Rincian (Rp)', 'Subtotal (Rp)');
  }

  const summaryRows = [
    ['LAPORAN AKTIFITAS KEUANGAN'],
    ['PESANTREN IBNU TAIMIYAH BOGOR'],
    [`Periode: ${activePeriodLabel}`],
    [''],
    tableHeader,
    ['A. PENERIMAAN', '', ''],
    ['A.1 PENERIMAAN RUTIN', '', '']
  ];

  function buildRow(name, code, desc, getterFn, arg) {
    const row = [name, code, desc];
    if (isMultiMonth) {
      visibleMonths.forEach(m => {
        row.push(getterFn(arg, m.key));
      });
      row.push(getterFn(arg, null));
    } else {
      const val = getterFn(arg, null);
      row.push(val, val);
    }
    return row;
  }

  function appendGroups(groups) {
    groups.forEach(g => {
      if (g.items.length === 1) {
        const item = g.items[0];
        summaryRows.push(buildRow(g.name, item.code, item.desc, (c, m) => getCodeSum(c, m), item.code));
      } else {
        const groupRow = [g.name, '', ''];
        if (isMultiMonth) {
          visibleMonths.forEach(m => groupRow.push(getGroupTotal(g, m.key)));
          groupRow.push(getGroupTotal(g, null));
        } else {
          groupRow.push('', getGroupTotal(g, null));
        }
        summaryRows.push(groupRow);

        g.items.forEach(it => {
          const itemRow = ['', it.code, it.desc];
          if (isMultiMonth) {
            visibleMonths.forEach(m => itemRow.push(getCodeSum(it.code, m.key)));
            itemRow.push(getCodeSum(it.code, null));
          } else {
            itemRow.push(getCodeSum(it.code, null), '');
          }
          summaryRows.push(itemRow);
        });
      }
    });
  }

  appendGroups(structure.penerimaanRutin.groups);

  // Subtotal Penerimaan Rutin
  const rowSubA1 = ['Total Penerimaan Rutin', '', ''];
  if (isMultiMonth) {
    visibleMonths.forEach(m => rowSubA1.push(sumPenerimaanRutin(m.key)));
    rowSubA1.push(sumPenerimaanRutin());
  } else {
    rowSubA1.push('', sumPenerimaanRutin());
  }
  summaryRows.push(rowSubA1);

  summaryRows.push(['A.2 PENERIMAAN TIDAK RUTIN', '', '']);
  appendGroups(structure.penerimaanTidakRutin.groups);

  const rowSubA2 = ['Total Penerimaan Tidak Rutin', '', ''];
  if (isMultiMonth) {
    visibleMonths.forEach(m => rowSubA2.push(sumPenerimaanTidakRutin(m.key)));
    rowSubA2.push(sumPenerimaanTidakRutin());
  } else {
    rowSubA2.push('', sumPenerimaanTidakRutin());
  }
  summaryRows.push(rowSubA2);

  // Grand Total A
  const rowGrandA = ['TOTAL PENERIMAAN (A)', '', ''];
  if (isMultiMonth) {
    visibleMonths.forEach(m => rowGrandA.push(grandTotalIncome(m.key)));
    rowGrandA.push(grandTotalIncome());
  } else {
    rowGrandA.push(grandTotalIncome(), grandTotalIncome());
  }
  summaryRows.push(rowGrandA, ['']);

  // Section B
  summaryRows.push(['B. BEBAN', '', ''], ['B.1 BEBAN RUTIN', '', '']);
  appendGroups(structure.bebanRutin.groups);

  const rowSubB1 = ['Total Beban Rutin', '', ''];
  if (isMultiMonth) {
    visibleMonths.forEach(m => rowSubB1.push(sumBebanRutin(m.key)));
    rowSubB1.push(sumBebanRutin());
  } else {
    rowSubB1.push('', sumBebanRutin());
  }
  summaryRows.push(rowSubB1);

  summaryRows.push(['B.2 BEBAN TIDAK RUTIN', '', '']);
  appendGroups(structure.bebanTidakRutin.groups);

  const rowSubB2 = ['Total Beban Tidak Rutin', '', ''];
  if (isMultiMonth) {
    visibleMonths.forEach(m => rowSubB2.push(sumBebanTidakRutin(m.key)));
    rowSubB2.push(sumBebanTidakRutin());
  } else {
    rowSubB2.push('', sumBebanTidakRutin());
  }
  summaryRows.push(rowSubB2);

  // Grand Total B
  const rowGrandB = ['TOTAL BEBAN (B)', '', ''];
  if (isMultiMonth) {
    visibleMonths.forEach(m => rowGrandB.push(grandTotalExpense(m.key)));
    rowGrandB.push(grandTotalExpense());
  } else {
    rowGrandB.push(grandTotalExpense(), grandTotalExpense());
  }
  summaryRows.push(rowGrandB, ['']);

  // Surplus / Defisit
  const rowSurplus = ['SURPLUS (DEFISIT) PERIODE INI', '', ''];
  if (isMultiMonth) {
    visibleMonths.forEach(m => rowSurplus.push(surplusDeficit(m.key)));
    rowSurplus.push(surplusDeficit());
  } else {
    rowSurplus.push(surplusDeficit(), surplusDeficit());
  }
  summaryRows.push(rowSurplus);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Laporan Aktivitas');

  // Lembar Detail Transaksi per Akun Aktif
  const activeCodes = [...new Set(filteredTransactions.map(t => t.code))].filter(Boolean);
  activeCodes.forEach(code => {
    const coaMeta = masterCoaList.find(c => c.kode === code) || { nama: 'Pos Akun' };
    const items = filteredTransactions.filter(t => t.code === code);
    if (items.length === 0) return;

    const sheetData = [
      [`RINCIAN TRANSAKSI: [${code}] ${coaMeta.nama}`],
      [`Periode: ${activePeriodLabel} | Total: ${formatIDR(getCodeSum(code))}`],
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

    sheetData.push(['', '', '', '', 'Total Pos:', '', getCodeSum(code)]);

    const wsDetail = XLSX.utils.aoa_to_sheet(sheetData);
    const sheetName = `${code}_${coaMeta.nama}`.replace(/[:\\/?*\[\]]/g, '').substring(0, 30);
    XLSX.utils.book_append_sheet(wb, wsDetail, sheetName);
  });

  return wb;
}

// 3. Download File ZIP Paket Laporan Lengkap
export async function downloadReportBundleZip({
  activityWorkbook,
  duWorkbook,
  fullStateJson,
  periodLabel
}) {
  let JSZipModule;
  try {
    const imported = await import('jszip');
    JSZipModule = imported.default || imported;
  } catch (e) {
    const cdnImport = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
    JSZipModule = cdnImport.default;
  }

  const zip = new JSZipModule();
  const cleanLabel = periodLabel.replace(/[\/\s:]+/g, '_');

  const wbActivityOut = XLSX.write(activityWorkbook, { bookType: 'xlsx', type: 'array' });
  zip.file(`1_Laporan_Aktivitas_Keuangan_PIT_${cleanLabel}.xlsx`, wbActivityOut);

  if (duWorkbook) {
    const wbDuOut = XLSX.write(duWorkbook, { bookType: 'xlsx', type: 'array' });
    zip.file(`2_Rincian_Daftar_Ulang_Semua_Santri_${cleanLabel}.xlsx`, wbDuOut);
  }

  zip.file(`3_Backup_Data_Sistem_PIT_${cleanLabel}.json`, JSON.stringify(fullStateJson, null, 2));

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `Paket_Laporan_Keuangan_PIT_${cleanLabel}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}