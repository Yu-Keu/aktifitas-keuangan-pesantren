<!-- src/components/HeaderNav.vue -->
<template>
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      
      <!-- Brand Minimalis -->
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold text-xs">
          PIT
        </div>
        <div>
          <h1 class="text-xs font-bold text-slate-900 tracking-tight leading-none">
            Pesantren Ibnu Taimiyah Bogor
          </h1>
          <span class="text-[10px] text-slate-500 font-medium">Laporan Aktifitas Keuangan Bulanan</span>
        </div>
      </div>

      <!-- Navigasi Tab Sederhana -->
      <nav class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
        <button
          @click="$emit('change-tab', 'report')"
          :class="currentTab === 'report' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3 py-1.5 rounded-md transition cursor-pointer"
        >
          Laporan Aktifitas
        </button>
        <button
          @click="$emit('change-tab', 'daftar-ulang')"
          :class="currentTab === 'daftar-ulang' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3 py-1.5 rounded-md transition cursor-pointer"
        >
          Daftar Ulang & Prioritas
        </button>
        <button
          @click="$emit('change-tab', 'upload')"
          :class="currentTab === 'upload' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3 py-1.5 rounded-md transition cursor-pointer"
        >
          Periode & Upload
        </button>
        <button
          @click="$emit('change-tab', 'all')"
          :class="currentTab === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3 py-1.5 rounded-md transition cursor-pointer"
        >
          Semua Transaksi
        </button>
      </nav>

    </div>
  </header>
</template>

<script setup>
defineProps({
  currentTab: { type: String, required: true }
});
defineEmits(['change-tab']);
</script>