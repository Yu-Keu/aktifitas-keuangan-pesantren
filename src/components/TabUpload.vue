<template>
  <section class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
          Data Ingestion Hub
        </span>
        <h2 class="text-xl font-extrabold mt-2 tracking-tight">Upload & Sinkronisasi Sumber Data Keuangan</h2>
        <p class="text-xs text-slate-400 mt-1 max-w-xl">
          Sistem otomatis mengurai Excel/CSV, memfilter pos akun, mencocokkan mutasi bank riil, dan menyusun jurnal siap pakai.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="resetAll"
          class="text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/50 border border-rose-800/60 hover:bg-rose-900/60 px-4 py-2 rounded-xl transition cursor-pointer"
        >
          Reset Semua Data
        </button>
      </div>
    </div>

    <!-- Upload Grid 4 Kolom -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Buku Besar / Kas Kecil -->
      <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition group relative">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs border border-rose-100">01</span>
            <span v-if="filesStatus.bukuBesar" class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">Terpasang ✓</span>
            <span v-else class="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">Belum Diunggah</span>
          </div>
          <h3 class="font-bold text-slate-900 text-sm">Monitoring Pengeluaran</h3>
          <p class="text-[11px] text-slate-500 mt-1">Buku Besar & Kas Kecil PIT (.xlsx mulai baris 5).</p>
        </div>

        <div class="mt-6">
          <label class="block relative w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition group-hover:border-slate-300">
            <input type="file" accept=".xlsx,.xls" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" @change="onFileChange($event, 'bukuBesar')" />
            <span class="text-xs font-semibold text-slate-700 block">Pilih / Drag File .xlsx</span>
            <span class="text-[10px] text-slate-400 mt-0.5 block">Format Standar Kas Kecil</span>
          </label>
        </div>
      </div>

      <!-- 2. Penerimaan Siswa & Umum -->
      <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition group relative">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">02</span>
            <span v-if="filesStatus.pemasukan" class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">Terpasang ✓</span>
            <span v-else class="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">Belum Diunggah</span>
          </div>
          <h3 class="font-bold text-slate-900 text-sm">Penerimaan Siswa & SPP</h3>
          <p class="text-[11px] text-slate-500 mt-1">Export Excel Laporan Penerimaan Siswa & Bank.</p>
        </div>

        <div class="mt-6">
          <label class="block relative w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition group-hover:border-slate-300">
            <input type="file" accept=".xlsx,.xls" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" @change="onFileChange($event, 'pemasukan')" />
            <span class="text-xs font-semibold text-slate-700 block">Pilih / Drag File .xlsx</span>
            <span class="text-[10px] text-slate-400 mt-0.5 block">Termasuk Auto-Routing SPP</span>
          </label>
        </div>
      </div>

      <!-- 3. Rekening Koran BSI -->
      <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-teal-400 transition group relative">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs border border-teal-100">03</span>
            <span v-if="filesStatus.bsi" class="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">Terpasang ✓</span>
            <span v-else class="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">Belum Diunggah</span>
          </div>
          <h3 class="font-bold text-slate-900 text-sm">Mutasi Koran Bank BSI</h3>
          <p class="text-[11px] text-slate-500 mt-1">Rekening Koran Giro / Tabungan BSI (.csv / .xlsx).</p>
        </div>

        <div class="mt-6">
          <label class="block relative w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/30 transition group-hover:border-slate-300">
            <input type="file" accept=".csv,.xlsx" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" @change="onFileChange($event, 'bsi')" />
            <span class="text-xs font-semibold text-slate-700 block">Upload Mutasi BSI</span>
            <span class="text-[10px] text-slate-400 mt-0.5 block">Format CSV Rekening Koran</span>
          </label>
        </div>
      </div>

      <!-- 4. Rekening Koran Muamalat -->
      <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-purple-400 transition group relative">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-100">04</span>
            <span v-if="filesStatus.muamalat" class="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">Terpasang ✓</span>
            <span v-else class="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">Belum Diunggah</span>
          </div>
          <h3 class="font-bold text-slate-900 text-sm">Mutasi Bank Muamalat</h3>
          <p class="text-[11px] text-slate-500 mt-1">Mutasi Koran Giro Muamalat (.csv / .xlsx).</p>
        </div>

        <div class="mt-6">
          <label class="block relative w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/30 transition group-hover:border-slate-300">
            <input type="file" accept=".csv,.xlsx" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" @change="onFileChange($event, 'muamalat')" />
            <span class="text-xs font-semibold text-slate-700 block">Upload Mutasi Muamalat</span>
            <span class="text-[10px] text-slate-400 mt-0.5 block">Format CSV Rekening Koran</span>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useFinance } from '../composables/useFinance.js';

const {
  filesStatus,
  uploadBukuBesar,
  uploadPemasukanExcel,
  uploadBsiCsv,
  uploadMuamalatCsv,
  resetAll
} = useFinance();

function onFileChange(e, type) {
  const file = e.target.files[0];
  if (!file) return;
  if (type === 'bukuBesar') uploadBukuBesar(file);
  else if (type === 'pemasukan') uploadPemasukanExcel(file);
  else if (type === 'bsi') uploadBsiCsv(file);
  else if (type === 'muamalat') uploadMuamalatCsv(file);
  e.target.value = '';
}
</script>