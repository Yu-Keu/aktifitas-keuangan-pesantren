<template>
  <div class="min-h-screen bg-slate-100/70 text-slate-800 antialiased font-sans flex flex-col">
    <!-- Overlay Loader -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex flex-col items-center justify-center text-white"
    >
      <div class="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mb-2.5"></div>
      <p class="font-medium text-xs text-slate-100">
        {{ loadingStatus || 'Sedang memproses data...' }}
      </p>
    </div>

    <!-- Modal Hasil Upload -->
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

    <!-- Modal Reassign POS (Single & Mass Pop-up Search) -->
    <ModalReassignCoa
      :isOpen="isReassignModalOpen"
      :targetIds="reassignTargetIds"
      :singleTransaction="singleReassignTransaction"
      :coaList="MASTER_COA_LIST"
      @close="isReassignModalOpen = false"
      @select-coa="handleConfirmReassign"
    />

    <!-- Modal Split Transaksi -->
    <ModalSplit
      :isOpen="isSplitModalOpen"
      :transaction="targetSplitTransaction"
      :coaList="MASTER_COA_LIST"
      @close="isSplitModalOpen = false"
      @save-split="handleSaveSplit"
    />

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
          @export-excel="exportFullExcel"
        />
      </div>

      <!-- ================= 2. TAB DETAIL TRANSAKSI (MINI-EXCEL DENGAN MASS REASSIGN & SEARCH) ================= -->
      <div v-else-if="activeTab === 'detail' && selectedAccountDetail" class="space-y-3">
        
        <!-- Header Rincian Pos -->
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
            <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Pos Ini:</span>
            <span class="text-sm font-mono font-bold text-slate-900">
              {{ formatIDR(getSumForCode(selectedAccountDetail.code)) }}
            </span>
          </div>
        </div>

        <!-- Filter & Batch Action Toolbar -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          
          <div class="flex flex-wrap items-center justify-between gap-3">
            <!-- Search Filter Bar -->
            <div class="flex items-center gap-2 flex-1 max-w-md">
              <div class="relative w-full">
                <input
                  v-model="detailSearchQuery"
                  type="text"
                  placeholder="Cari uraian transaksi / nama siswa..."
                  class="w-full border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs bg-slate-50 outline-none focus:bg-white focus:border-emerald-500 font-medium"
                />
                <span class="absolute left-2.5 top-1.5 text-slate-400 text-xs">🔍</span>
                <button
                  v-if="detailSearchQuery"
                  @click="detailSearchQuery = ''"
                  class="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >✕</button>
              </div>
            </div>

            <!-- Batch Action Buttons -->
            <div v-if="selectedDetailIds.length > 0" class="flex items-center gap-2 animate-in fade-in duration-150">
              <span class="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                {{ selectedDetailIds.length }} Terpilih
              </span>
              
              <button
                @click="openMassReassignModal(selectedDetailIds)"
                class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1"
              >
                <span>🏷</span> Ganti POS Sekaligus
              </button>

              <button
                @click="batchDelete"
                class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                Hapus Terpilih
              </button>
            </div>
          </div>

          <!-- Tabel Interaktif Mini-Excel -->
          <div class="overflow-x-auto border border-slate-200 rounded-lg">
            <table class="min-w-full text-xs divide-y divide-slate-200">
              <thead class="bg-slate-50 font-semibold text-slate-600 text-left">
                <tr>
                  <!-- Checkbox Select All -->
                  <th class="px-3 py-2 w-10 text-center">
                    <input
                      type="checkbox"
                      :checked="isAllDetailSelected"
                      @change="toggleSelectAllDetail"
                      class="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th class="px-3 py-2 w-24">Tanggal</th>
                  <th class="px-3 py-2 w-32">POS / COA</th>
                  <th class="px-3 py-2">Uraian Transaksi</th>
                  <th class="px-3 py-2 w-36">Petugas / Asal</th>
                  <th class="px-3 py-2 text-right w-32">Nominal (Rp)</th>
                  <th class="px-3 py-2 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr
                  v-for="t in filteredDetailTransactions"
                  :key="t.id"
                  class="hover:bg-slate-50 transition"
                  :class="{ 'bg-indigo-50/30': selectedDetailIds.includes(t.id), 'bg-amber-50/40': t.isSplitItem }"
                >
                  <!-- Checkbox Baris -->
                  <td class="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      :value="t.id"
                      v-model="selectedDetailIds"
                      class="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  <td class="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{{ t.date }}</td>
                  
                  <!-- Tombol Pop-up Reassign POS -->
                  <td class="px-3 py-2">
                    <button
                      @click="openReassignModal(t)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs transition cursor-pointer hover:shadow-xs group"
                      :class="t.code.startsWith('A') ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'"
                      title="Klik untuk mencari & mengganti POS"
                    >
                      <span>{{ t.code }}</span>
                      <span class="text-[9px] text-slate-400 group-hover:text-slate-700">🔍</span>
                    </button>
                  </td>

                  <td class="px-3 py-2">
                    <input
                      type="text"
                      v-model="t.desc"
                      class="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white px-1 py-0.5 rounded text-xs text-slate-900 font-medium outline-none"
                    />
                  </td>

                  <td class="px-3 py-2 text-slate-500 text-[11px]">{{ t.pic }} ({{ t.pos }})</td>

                  <td class="px-3 py-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {{ formatIDR(t.amount) }}
                  </td>

                  <td class="px-3 py-2 text-center space-x-1.5 whitespace-nowrap">
                    <button
                      @click="openSplitModal(t)"
                      class="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition cursor-pointer"
                      title="Pecah nominal transaksi ini"
                    >
                      Split
                    </button>
                    <button
                      @click="deleteTransaction(t.id)"
                      class="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded transition cursor-pointer"
                      title="Hapus baris"
                    >
                      ✕
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredDetailTransactions.length === 0">
                  <td colspan="7" class="p-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok pada pos ini.
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
            <h2 class="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">2. Upload Sumber Data Excel (.xlsx / .csv)</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <!-- Monitoring Pengeluaran -->
              <div class="border-2 border-dashed rounded-xl p-4 transition" :class="filesStatus.pengeluaran.uploaded ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-slate-900">Monitoring Pengeluaran</span>
                  <span v-if="filesStatus.pengeluaran.uploaded" class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Terpasang ✓ ({{ filesStatus.pengeluaran.count }} baris)
                  </span>
                  <span v-else class="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                    Belum Diunggah
                  </span>
                </div>
                <p v-if="filesStatus.pengeluaran.uploaded" class="text-[11px] text-emerald-700 font-mono truncate mb-2">
                  {{ filesStatus.pengeluaran.fileName }}
                </p>
                <label class="block text-center cursor-pointer bg-white border border-slate-200 hover:border-emerald-500 py-2.5 rounded-lg text-xs font-semibold text-slate-700 transition">
                  <input type="file" accept=".xlsx,.xls,.csv" @change="onUpload($event, 'pengeluaran')" class="hidden" />
                  <span>{{ filesStatus.pengeluaran.uploaded ? 'Ganti File Pengeluaran' : 'Pilih File Kas Kecil (.xlsx)' }}</span>
                </label>
              </div>

              <!-- Laporan Penerimaan -->
              <div class="border-2 border-dashed rounded-xl p-4 transition" :class="filesStatus.penerimaan.uploaded ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-slate-900">Penerimaan Siswa & SPP</span>
                  <span v-if="filesStatus.penerimaan.uploaded" class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Terpasang ✓ ({{ filesStatus.penerimaan.count }} baris)
                  </span>
                  <span v-else class="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                    Belum Diunggah
                  </span>
                </div>
                <p v-if="filesStatus.penerimaan.uploaded" class="text-[11px] text-emerald-700 font-mono truncate mb-2">
                  {{ filesStatus.penerimaan.fileName }}
                </p>
                <label class="block text-center cursor-pointer bg-white border border-slate-200 hover:border-emerald-500 py-2.5 rounded-lg text-xs font-semibold text-slate-700 transition">
                  <input type="file" accept=".xlsx,.xls,.csv" @change="onUpload($event, 'penerimaan')" class="hidden" />
                  <span>{{ filesStatus.penerimaan.uploaded ? 'Ganti File Penerimaan' : 'Pilih File Penerimaan (.xlsx)' }}</span>
                </label>
              </div>

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
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xs font-bold text-slate-900 uppercase">Semua Transaksi Terpasang ({{ filteredAllTransactions.length }})</h2>
            <div class="flex items-center gap-2">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari transaksi / akun..."
                class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-slate-50 outline-none w-56 placeholder:text-slate-400"
              />
              <button
                @click="exportFullExcel"
                class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Download Excel
              </button>
            </div>
          </div>

          <div class="overflow-x-auto border border-slate-200 rounded-lg">
            <table class="min-w-full text-xs divide-y divide-slate-200">
              <thead class="bg-slate-50 font-semibold text-slate-600 text-left">
                <tr>
                  <th class="px-3 py-2 w-24">Tanggal</th>
                  <th class="px-3 py-2 w-32">POS (COA)</th>
                  <th class="px-3 py-2">Keterangan</th>
                  <th class="px-3 py-2 w-32">Petugas</th>
                  <th class="px-3 py-2 text-center w-24">Tipe</th>
                  <th class="px-3 py-2 text-right w-32">Nominal (Rp)</th>
                  <th class="px-3 py-2 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr v-for="t in filteredAllTransactions" :key="t.id" class="hover:bg-slate-50">
                  <td class="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{{ t.date }}</td>
                  
                  <td class="px-3 py-2">
                    <button
                      @click="openReassignModal(t)"
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono font-bold text-[11px] transition cursor-pointer hover:shadow-xs group"
                      :class="t.code.startsWith('A') ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'"
                      title="Klik untuk mencari & mengganti POS"
                    >
                      <span>{{ t.code }}</span>
                      <span class="text-[9px] text-slate-400 group-hover:text-slate-700">🔍</span>
                    </button>
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
                  
                  <td class="px-3 py-2 text-center space-x-1.5 whitespace-nowrap">
                    <button
                      @click="openSplitModal(t)"
                      class="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      Split
                    </button>
                    <button
                      @click="deleteTransaction(t.id)"
                      class="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredAllTransactions.length === 0">
                  <td colspan="7" class="p-6 text-center text-slate-400">Tidak ada transaksi yang cocok.</td>
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
import { ref, computed, watch } from 'vue';
import HeaderNav from './components/HeaderNav.vue';
import ActivityReportTable from './components/ActivityReportTable.vue';
import ModalSplit from './components/ModalSplit.vue';
import ModalReassignCoa from './components/ModalReassignCoa.vue';
import { useFinance } from './composables/useFinance.js';
import { formatIDR } from './utils/formatters.js';

const {
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
} = useFinance();

const searchQuery = ref('');
const detailSearchQuery = ref('');
const selectedDetailIds = ref([]);

watch(selectedAccountDetail, () => {
  selectedDetailIds.value = [];
  detailSearchQuery.value = '';
});

const filteredDetailTransactions = computed(() => {
  if (!selectedAccountDetail.value) return [];
  const baseItems = getTransactionsForCode(selectedAccountDetail.value.code);
  const q = detailSearchQuery.value.toLowerCase().trim();
  if (!q) return baseItems;
  return baseItems.filter(
    t =>
      (t.desc || '').toLowerCase().includes(q) ||
      (t.pos || '').toLowerCase().includes(q) ||
      (t.pic || '').toLowerCase().includes(q) ||
      (t.date || '').toLowerCase().includes(q)
  );
});

const isAllDetailSelected = computed(() => {
  return (
    filteredDetailTransactions.value.length > 0 &&
    selectedDetailIds.value.length === filteredDetailTransactions.value.length
  );
});

function toggleSelectAllDetail() {
  if (isAllDetailSelected.value) {
    selectedDetailIds.value = [];
  } else {
    selectedDetailIds.value = filteredDetailTransactions.value.map(t => t.id);
  }
}

function batchDelete() {
  deleteMassTransactions(selectedDetailIds.value);
  selectedDetailIds.value = [];
}

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