<template>
  <section class="space-y-4">
    <!-- Filter Toolbar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <!-- Filter Tanggal -->
        <select
          v-model="filterPemasukan.date"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
        >
          <option value="ALL">Semua Tanggal</option>
          <option v-for="d in availableDatesPemasukan" :key="d" :value="d">{{ d }}</option>
        </select>

        <!-- Filter Bank -->
        <select
          v-model="filterPemasukan.bank"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
        >
          <option value="ALL">Semua Bank</option>
          <option v-for="b in availableBanksPemasukan" :key="b" :value="b">{{ b }}</option>
        </select>

        <!-- Search -->
        <div class="relative">
          <input
            type="text"
            v-model="filterPemasukan.search"
            placeholder="Cari akun / siswa..."
            class="border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 w-52 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white transition placeholder:text-slate-400 font-medium"
          />
          <span
            v-if="filterPemasukan.search"
            @click="filterPemasukan.search = ''"
            class="absolute right-2 top-1.5 text-slate-400 cursor-pointer hover:text-slate-700 font-bold"
          >✕</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="exportPemasukanExcel"
          class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-bold shadow-xs transition cursor-pointer"
        >
          Download Excel
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left w-36">Tanggal & Bank</th>
              <th class="px-4 py-3 text-left w-64 text-emerald-950">COA Tujuan & Pos</th>
              <th class="px-4 py-3 text-left">Uraian / Keterangan</th>
              <th class="px-4 py-3 text-center w-36">Kategori</th>
              <th class="px-4 py-3 text-right w-36">Nominal (Rp)</th>
              <th class="px-4 py-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in filteredPemasukan"
              :key="item.id"
              class="hover:bg-slate-50 transition"
            >
              <td class="px-4 py-2.5 whitespace-nowrap">
                <div class="font-mono font-bold text-slate-800">{{ item.tglFormatted }}</div>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 mt-0.5 inline-block">
                  {{ item.kasBank }}
                </span>
              </td>

              <td class="px-4 py-2.5">
                <div class="bg-emerald-50/80 border border-emerald-200 p-2 rounded-xl">
                  <div class="font-mono font-bold text-emerald-950 text-xs">{{ item.coaBaru }}</div>
                  <div class="text-[10px] text-emerald-700 font-medium truncate mt-0.5">{{ item.posPenerimaan }}</div>
                </div>
              </td>

              <td class="px-4 py-2.5">
                <span class="text-slate-800 font-medium">{{ item.uraianJurnal }}</span>
              </td>

              <td class="px-4 py-2.5 text-center">
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block"
                  :class="{
                    'bg-emerald-50 text-emerald-700 border-emerald-200': item.kategori === 'TAPEL SEKARANG',
                    'bg-amber-50 text-amber-700 border-amber-200': item.kategori === 'BULAN LALU',
                    'bg-sky-50 text-sky-700 border-sky-200': item.kategori === 'BULAN DEPAN',
                  }"
                >
                  {{ item.kategori }}
                </span>
              </td>

              <td
                @click="copyNominal(item.totalPenerimaan)"
                class="px-4 py-2.5 text-right font-mono font-bold text-slate-900 cursor-pointer hover:bg-emerald-100/50 rounded transition"
              >
                {{ formatRupiah(item.totalPenerimaan) }}
              </td>

              <td class="px-4 py-2.5 text-center">
                <button
                  @click="handlePemasukanRowAction(item)"
                  :class="item.justCopied ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'"
                  class="px-2.5 py-1 text-[10px] rounded-lg font-semibold transition cursor-pointer"
                >
                  {{ item.justCopied ? 'OK' : 'Copy' }}
                </button>
              </td>
            </tr>

            <tr v-if="filteredPemasukan.length === 0">
              <td colspan="6" class="p-12 text-center text-slate-400">
                Tidak ada transaksi penerimaan yang cocok.
              </td>
            </tr>
          </tbody>

          <!-- Footer Total -->
          <tfoot class="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
            <tr>
              <td colspan="4" class="px-4 py-3 text-right uppercase text-[10px] text-slate-500 font-semibold">
                Total ({{ totalTransPemasukan }} Transaksi)
              </td>
              <td class="px-4 py-3 text-right font-mono text-xs">
                {{ formatRupiah(totalNominalPemasukan) }}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useFinance } from '../composables/useFinance.js';
import { formatRupiah } from '../utils/formatters.js';

const {
  filterPemasukan,
  availableDatesPemasukan,
  availableBanksPemasukan,
  filteredPemasukan,
  totalTransPemasukan,
  totalNominalPemasukan,
  exportPemasukanExcel,
  copyNominal,
  handlePemasukanRowAction
} = useFinance();
</script>