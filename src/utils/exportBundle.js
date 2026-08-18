// src/utils/exportBundle.js
import * as XLSX from 'xlsx';

// 1. Ekspor Rincian Daftar Ulang Seluruh Santri ke File Excel Terpisah
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

  // BARIS TOTAL DI BAWAH EXCEL
  wsData.push(['', '', '', '', 'TOTAL ALOKASI PEMBAYARAN:', '', totalAmount]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Rincian Daftar Ulang');
  return wb;
}

// 2. Download File ZIP Paket Laporan
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

  const wbActivityOut = XLSX.write(activityWorkbook, { bookType: 'xlsx', type: 'array' });
  zip.file(`1_Laporan_Aktivitas_Keuangan_PIT_${periodLabel.replace(/\s+/g, '_')}.xlsx`, wbActivityOut);

  if (duWorkbook) {
    const wbDuOut = XLSX.write(duWorkbook, { bookType: 'xlsx', type: 'array' });
    zip.file(`2_Rincian_Daftar_Ulang_Semua_Santri_${periodLabel.replace(/\s+/g, '_')}.xlsx`, wbDuOut);
  }

  zip.file(`3_Backup_Data_Sistem_PIT_${periodLabel.replace(/\s+/g, '_')}.json`, JSON.stringify(fullStateJson, null, 2));

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `Paket_Laporan_Keuangan_PIT_${periodLabel.replace(/\s+/g, '_')}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}