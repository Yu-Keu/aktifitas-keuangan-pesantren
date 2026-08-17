<template>
  <section class="space-y-4">
    <!-- Top Filter & Selector Bidang -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Pilih Bidang Unit:</span>
        <select
          v-model="filterBidang.kodeBidang"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-indigo-50 font-bold text-indigo-950 outline-none focus:border-indigo-500 transition cursor-pointer"
        >
          <option value="ALL">Semua Unit / Konsolidasi Mahad</option>
          <option v-for="b in availableBidangList" :key="b.kode" :value="b.kode">
            {{ b.kode }} - {{ b.nama }}
          </option>
        </select>

        <select
          v-model="filterBidang.statusSplit"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">Semua Status Alokasi</option>
          <option value="SPLIT">Hanya Transaksi Split</option>
          <option value="UNSPLIT">Belum Di-Split</option>
        </select>
      </div>
    </div>

    <!-- Bidang Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left w-36">Tanggal & Kas</th>
              <th class="px-4 py-3 text-left w-48">Unit Pembebanan</th>
              <th class="px-4 py-3 text-left w-52">COA Akun</th>
              <th class="px-4 py-3 text-left">Uraian Biaya</th>
              <th class="px-4 py-3 text-right w-36">Nominal (Rp)</th>
              <th class="px-4 py-3 text-center w-28">Alokasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in filteredBidangData"
              :key="item.id"
              class="hover:bg-slate-50 transition"
              :class="{ 'bg-indigo-50/30': item.isSplitChild }"
            >
              <td class="px-4 py-2.5 whitespace-nowrap">
                <div class="font-mono font-bold text-slate-800">{{ item.tanggal }}</div>
                <div class="text-[10px] text-slate-500">{{ item.kasBank }}</div>
              </td>

              <td class="px-4 py-2.5">
                <span class="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                  {{ item.bidang || 'Markaz / Mahad' }}
                </span>
              </td>

              <td class="px-4 py-2.5">
                <span class="font-mono font-bold text-slate-800">{{ item.kodeAkun }}</span>
                <span class="text-slate-500 ml-1">- {{ item.namaAkun }}</span>
              </td>

              <td class="px-4 py-2.5 text-slate-800 font-medium">
                {{ item.uraian }}
                <span v-if="item.isSplitChild" class="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded ml-1 font-bold">Split</span>
              </td>

              <td class="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                {{ formatRupiah(item.debet || item.kredit) }}
              </td>

              <td class="px-4 py-2.5 text-center">
                <button
                  v-if="!item.isSplitChild && !item.isSplitParent"
                  @click="openSplitModal(item)"
                  class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 text-[10px] rounded-lg font-bold transition cursor-pointer"
                >
                  Split Unit
                </button>
                <button
                  v-else-if="item.isSplitParent"
                  @click="unsplitTransaction(item.splitGroupId)"
                  class="text-rose-600 text-[10px] hover:underline font-bold"
                >
                  Batal Split
                </button>
                <span v-else class="text-slate-400 text-[10px]">Alokasi</span>
              </td>
            </tr>

            <tr v-if="filteredBidangData.length === 0">
              <td colspan="6" class="p-12 text-center text-slate-400">
                Tidak ada data biaya pada unit ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useFinance } from '../composables/useFinance.js';
import { formatRupiah } from '../utils/formatters.js';

const {
  filterBidang,
  availableBidangList,
  filteredBidangData,
  openSplitModal,
  unsplitTransaction
} = useFinance();
</script>