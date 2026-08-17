<template>
  <div v-if="showLPJModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-extrabold text-slate-900 text-base">Ikat Paket Jurnal LPJ Kasbon</h3>
        <button @click="showLPJModal = false" class="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
      </div>

      <div class="space-y-2 text-xs">
        <div class="bg-slate-50 p-3 rounded-xl space-y-1.5 border border-slate-200/60">
          <div class="flex justify-between text-slate-600">
            <span>Total Belanja Riil (Debit):</span>
            <span class="font-mono font-bold text-slate-900">{{ formatRupiah(lpjSummary.totalBeban) }}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Total Uang Muka Kasbon (Kredit):</span>
            <span class="font-mono font-bold text-slate-900">{{ formatRupiah(lpjSummary.totalKasbon) }}</span>
          </div>
          <div class="border-t border-slate-200 pt-1.5 flex justify-between font-bold">
            <span class="text-slate-800">Status Selisih:</span>
            <span :class="lpjSummary.isReimburse ? 'text-amber-600' : 'text-emerald-600'">
              {{ lpjSummary.status }} ({{ formatRupiah(lpjSummary.selisih) }})
            </span>
          </div>
        </div>

        <div>
          <label class="block text-slate-700 font-bold mb-1">Uraian Paket Jurnal:</label>
          <input
            v-model="lpjUraian"
            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button
          @click="showLPJModal = false"
          class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
        >
          Batal
        </button>
        <button
          @click="confirmLPJGroup"
          class="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
        >
          Konfirmasi Ikat LPJ
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFinance } from '../../composables/useFinance.js';
import { formatRupiah } from '../../utils/formatters.js';

const { showLPJModal, lpjUraian, lpjSummary, confirmLPJGroup } = useFinance();
</script>