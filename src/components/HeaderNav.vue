<!-- src/components/HeaderNav.vue -->
<template>
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      
      <!-- Brand Minimalis PIT -->
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs">
          PIT
        </div>
        <div>
          <h1 class="text-xs font-bold text-slate-900 tracking-tight leading-none">
            Pesantren Ibnu Taimiyah Bogor
          </h1>
          <span class="text-[10px] text-slate-500 font-medium">Laporan Aktifitas Keuangan</span>
        </div>
      </div>

      <!-- Navigasi 3 Tab Utama -->
      <nav class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs border border-slate-200/60">
        <button
          @click="$emit('change-tab', 'report')"
          :class="currentTab === 'report' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3.5 py-1.5 rounded-lg transition cursor-pointer"
        >
          Laporan Aktifitas
        </button>
        <button
          @click="$emit('change-tab', 'daftar-ulang')"
          :class="currentTab === 'daftar-ulang' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3.5 py-1.5 rounded-lg transition cursor-pointer"
        >
          Daftar Ulang & Prioritas
        </button>
        <button
          @click="$emit('change-tab', 'upload')"
          :class="currentTab === 'upload' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3.5 py-1.5 rounded-lg transition cursor-pointer"
        >
          Periode & Upload
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