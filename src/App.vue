<template>
  <div class="min-h-screen bg-slate-100/70 text-slate-800 antialiased font-sans flex flex-col">
    <!-- Overlay Loader -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex flex-col items-center justify-center text-white"
    >
      <div class="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mb-2.5"></div>
      <p class="font-medium text-xs text-slate-100">
        {{ loadingStatus || 'Sedang memproses data Excel...' }}
      </p>
    </div>

    <!-- Modal Hasil Upload (Menggantikan Alert) -->
    <div
      v-if="uploadResultModal.show"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base"
            :class="uploadResultModal.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'"
          >
            {{ uploadResultModal.success ? '✓' : '✕' }}
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-sm">{{ uploadResultModal.title }}</h3>
            <p class="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">{{ uploadResultModal.fileName }}</p>
          </div>
        </div>

        <div class="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 border border-slate-200/70">
          <div class="flex justify-between text-slate-600">
            <span>Transaksi Dimuat:</span>
            <span class="font-mono font-bold text-slate-900">{{ uploadResultModal.loadedCount }} baris</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Dilewati (Beda Periode):</span>
            <span class="font-mono text-slate-500">{{ uploadResultModal.skippedCount }} baris</span>
          </div>
          <p class="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
            {{ uploadResultModal.message }}
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button
            @click="uploadResultModal.show = false"
            class="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- Header Navigation -->
    <HeaderNav :currentTab="activeTab" @change-tab="activeTab = $event" />

    <main class="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
      
      <!-- ================= 1. TAB LAPORAN UTAMA ================= -->
      <div v-if="activeTab === 'report'">
        <ActivityReportTable
          :structure="REPORT_STRUCTURE"
          :activePeriod="activePeriodLabel"
          :getCodeSum="getSumForCode"
          :sumIncomeRutin="sumPenerimaanRutin"
          :sumIncomeNonRutin="sumPenerimaanTidakRutin"
          :grandTotalIncome="grandTotalIncome"
          :sumExpenseRutin="sumBebanRutin"
          :sumExpenseNonRutin="sumBebanTidakRutin"
          :grandTotalExpense="grandTotalExpense"
          :surplusDeficit="surplusDeficit"
          @open-upload="activeTab = 'upload'"
          @select-detail="setDetailAccount"
        />
      </div>

      <!-- ================= 2. TAB DETAIL TRANSAKSI ================= -->
      <div v-else-if="activeTab === 'detail' && selectedAccountDetail" class="space-y-3">
        <!-- Floating Navigation Header di Tab Detail -->
        <div class="sticky top-12 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button
              @click="backToReport"
              class="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>&larr;</span> Kembali ke Laporan
            </button>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                {{ selectedAccountDetail.code }}
              </span>
              <h2 class="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {{ selectedAccountDetail.desc }}
              </h2>
            </div>
          </div>

          <div class="text-right">
            <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Pos:</span>
            <span class="text-sm font-mono font-bold text-slate-900">
              {{ formatIDR(getSumForCode(selectedAccountDetail.code)) }}
            </span>
          </div>
        </div>

        <!-- Tabel Transaksi Rincian -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div class="overflow-x-auto border border-slate-200 rounded-lg">
            <table class="min-w-full text-xs divide-y divide-slate-200">
              <thead class="bg-slate-50 font-semibold text-slate-600 text-left">
                <tr>
                  <th class="px-3 py-2 w-28">Tanggal</th>
                  <th class="px-3 py-2">Uraian Transaksi</th>
                  <th class="px-3 py-2 w-36">Petugas / Bank</th>
                  <th class="px-3 py-2 w-48">Pos Asal</th>
                  <th class="px-3 py-2 text-right w-36">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr
                  v-for="t in getTransactionsForCode(selectedAccountDetail.code)"
                  :key="t.id"
                  class="hover:bg-slate-50 transition"
                >
                  <td class="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{{ t.date }}</td>
                  <td class="px-3 py-2 text-slate-900 font-medium">{{ t.desc }}</td>
                  <td class="px-3 py-2 text-slate-600">{{ t.pic }}</td>
                  <td class="px-3 py-2 text-slate-500 font-mono text-[11px]">{{ t.pos }}</td>
                  <td class="px-3 py-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {{ formatIDR(t.amount) }}
                  </td>
                </tr>
                <tr v-if="getTransactionsForCode(selectedAccountDetail.code).length === 0">
                  <td colspan="5" class="p-8 text-center text-slate-400">
                    Tidak ada transaksi pada pos ini untuk periode aktif.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ================= 3. TAB UPLOAD & PERIODE ================= -->
      <div v-else-if="activeTab === 'upload'">
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div>
            <h2 class="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">1. Pilih Periode Laporan</h2>
            <div class="flex gap-2">
              <select v-model.number="selectedMonth" class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-slate-50 font-semibold outline-none cursor-pointer">
                <option v-for="(name, idx) in MONTH_NAMES.slice(1)" :key="idx" :value="idx + 1">{{ name }}</option>
              </select>
              <select v-model.number="selectedYear" class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-slate-50 font-semibold outline-none cursor-pointer">
                <option :value="2025">2025</option>
                <option :value="2026">2026</option>
                <option :value="2027">2027</option>
              </select>
            </div>
          </div>

          <div class="border-t border-slate-200 pt-4">
            <h2 class="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">2. Upload File Excel (.xlsx / .csv)</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="border border-dashed border-slate-300 hover:border-slate-500 bg-slate-50/50 p-4 rounded-xl text-center cursor-pointer block transition">
                <input type="file" accept=".xlsx,.xls,.csv" @change="onUpload($event, 'pengeluaran')" class="hidden" />
                <span class="text-xs font-bold text-slate-800 block">File Monitoring Pengeluaran</span>
                <span class="text-[10px] text-slate-400 block mt-0.5">Membaca Sheet Kas Kecil (Kolom A & C)</span>
              </label>
              <label class="border border-dashed border-slate-300 hover:border-slate-500 bg-slate-50/50 p-4 rounded-xl text-center cursor-pointer block transition">
                <input type="file" accept=".xlsx,.xls,.csv" @change="onUpload($event, 'penerimaan')" class="hidden" />
                <span class="text-xs font-bold text-slate-800 block">File Laporan Penerimaan Siswa</span>
                <span class="text-[10px] text-slate-400 block mt-0.5">Format Laporan Siswa & Bank</span>
              </label>
            </div>
          </div>

          <div class="border-t border-slate-200 pt-3 flex items-center justify-between">
            <button @click="clearAllData" class="text-xs text-rose-600 hover:underline font-semibold cursor-pointer">
              Bersihkan Semua Data
            </button>
            <button @click="activeTab = 'report'" class="text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition cursor-pointer">
              Lihat Laporan &rarr;
            </button>
          </div>
        </div>
      </div>

      <!-- ================= 4. TAB SEMUA TRANSAKSI ================= -->
      <div v-else-if="activeTab === 'all'">
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-xs font-bold text-slate-900 uppercase">Semua Transaksi Terpasang ({{ filteredAllTransactions.length }})</h2>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari transaksi / akun..."
              class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-slate-50 outline-none w-56 placeholder:text-slate-400"
            />
          </div>

          <div class="overflow-x-auto border border-slate-200 rounded-lg">
            <table class="min-w-full text-xs divide-y divide-slate-200">
              <thead class="bg-slate-50 font-semibold text-slate-600 text-left">
                <tr>
                  <th class="px-3 py-2 w-28">Tanggal</th>
                  <th class="px-3 py-2 text-center w-20">Kode</th>
                  <th class="px-3 py-2">Keterangan</th>
                  <th class="px-3 py-2 w-32">Petugas</th>
                  <th class="px-3 py-2 text-center w-24">Tipe</th>
                  <th class="px-3 py-2 text-right w-32">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr v-for="t in filteredAllTransactions" :key="t.id" class="hover:bg-slate-50">
                  <td class="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{{ t.date }}</td>
                  <td class="px-3 py-2 text-center">
                    <span class="font-mono font-semibold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {{ t.code }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-slate-900 font-medium">{{ t.desc }}</td>
                  <td class="px-3 py-2 text-slate-600">{{ t.pic }}</td>
                  <td class="px-3 py-2 text-center">
                    <span
                      class="text-[10px] font-semibold px-2 py-0.5 rounded"
                      :class="t.type === 'PENERIMAAN' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                    >
                      {{ t.type }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-right font-mono font-semibold whitespace-nowrap">{{ formatIDR(t.amount) }}</td>
                </tr>
                <tr v-if="filteredAllTransactions.length === 0">
                  <td colspan="6" class="p-6 text-center text-slate-400">Tidak ada transaksi yang cocok.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import HeaderNav from './components/HeaderNav.vue';
import ActivityReportTable from './components/ActivityReportTable.vue';
import { useFinance } from './composables/useFinance.js';
import { formatIDR } from './utils/formatters.js';

const {
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
} = useFinance();

const searchQuery = ref('');

const filteredAllTransactions = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return transactions.value;
  return transactions.value.filter(
    t =>
      (t.code || '').toLowerCase().includes(q) ||
      (t.desc || '').toLowerCase().includes(q) ||
      (t.pos || '').toLowerCase().includes(q) ||
      (t.pic || '').toLowerCase().includes(q)
  );
});

async function onUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    await processExcelFile(file, type);
  } catch (err) {
    console.error(err);
  } finally {
    event.target.value = '';
  }
}
</script>