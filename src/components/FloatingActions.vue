<template>
  <transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-12 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-12 opacity-0"
  >
    <div
      v-if="selectedCountPengeluaran >= 2"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-4"
    >
      <div class="flex items-center gap-2 pr-3 border-r border-slate-700">
        <span class="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
          {{ selectedCountPengeluaran }}
        </span>
        <span class="text-xs font-semibold text-slate-300">Baris Terpilih</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="calculateLPJGroup"
          class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>📦</span> Ikat Jadi LPJ
        </button>

        <button
          @click="openMergeModal"
          class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>🔗</span> Merge Mutasi Bank
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useFinance } from '../composables/useFinance.js';

const { selectedCountPengeluaran, calculateLPJGroup, openMergeModal } = useFinance();
</script>