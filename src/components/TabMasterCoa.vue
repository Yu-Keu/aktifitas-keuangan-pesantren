<template>
  <section class="space-y-4">
    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
      <div>
        <h2 class="font-extrabold text-slate-900 text-sm">Master Bagan Akun Standar (COA)</h2>
        <p class="text-[11px] text-slate-500">Daftar klasifikasi pos penerimaan dan beban Mahad Ibnu Taimiyah.</p>
      </div>
      <input
        type="text"
        v-model="coaSearchQuery"
        placeholder="Cari kode atau nama akun..."
        class="border border-slate-200 rounded-xl px-3 py-1.5 w-64 bg-slate-50 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="coa in filteredCOAList"
        :key="coa.kode"
        class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition flex items-start gap-3"
      >
        <span
          class="font-mono font-bold text-xs px-2 py-1 rounded-lg shrink-0"
          :class="coa.kode.startsWith('A') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'"
        >
          {{ coa.kode }}
        </span>
        <div class="min-w-0">
          <h4 class="text-xs font-bold text-slate-800 truncate">{{ coa.nama }}</h4>
          <span class="text-[10px] text-slate-400 font-semibold">{{ coa.kode.startsWith('A') ? 'Penerimaan' : 'Beban Operasional' }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useFinance } from '../composables/useFinance.js';

const { coaSearchQuery, filteredCOAList } = useFinance();
</script>