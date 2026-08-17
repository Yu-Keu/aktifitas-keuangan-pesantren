<template>
  <div v-if="isOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
      
      <!-- Header Modal -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 class="font-bold text-slate-900 text-sm">
            {{ isBatch ? `Pilih Pos Baru (${targetIds.length} Transaksi Terpilih)` : 'Pilih / Ganti POS Akun (COA)' }}
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Cari kode atau nama pos untuk memindahkan transaksi ini.</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer">✕</button>
      </div>

      <!-- Info Transaksi Terpilih -->
      <div v-if="!isBatch && singleTransaction" class="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
        <div class="flex justify-between items-center">
          <span class="text-slate-500">POS Saat Ini:</span>
          <span class="font-mono font-bold px-2 py-0.5 rounded text-[11px]" :class="singleTransaction.code.startsWith('A') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
            {{ singleTransaction.code }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Uraian:</span>
          <span class="font-semibold text-slate-800 text-right max-w-xs truncate">{{ singleTransaction.desc }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Nominal:</span>
          <span class="font-mono font-bold text-slate-900">{{ formatIDR(singleTransaction.amount) }}</span>
        </div>
      </div>

      <div v-else class="bg-indigo-50/80 border border-indigo-200 p-3 rounded-xl text-xs text-indigo-950 flex items-center justify-between">
        <span>Memindahkan <strong>{{ targetIds.length }} baris transaksi terpilih</strong> ke POS yang sama.</span>
        <span class="font-mono font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded text-[11px]">{{ targetIds.length }} Baris</span>
      </div>

      <!-- Search Input Auto-Focus -->
      <div class="relative">
        <input
          ref="searchInputRef"
          type="text"
          v-model="searchQuery"
          placeholder="Ketik kode (misal: A24, A121, B11) atau nama pos..."
          class="w-full border-2 border-emerald-500/80 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition placeholder:text-slate-400"
        />
        <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
        >
          ✕
        </button>
      </div>

      <!-- Search Results List -->
      <div class="overflow-y-auto flex-1 space-y-1.5 pr-1 divide-y divide-slate-100">
        <div
          v-for="coa in filteredCOAs"
          :key="coa.kode"
          @click="selectCoa(coa.kode)"
          class="p-2.5 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="font-mono font-bold text-xs px-2 py-1 rounded-md shrink-0 transition"
              :class="coa.kode.startsWith('A') ? 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-rose-100 text-rose-800 group-hover:bg-rose-600 group-hover:text-white'"
            >
              {{ coa.kode }}
            </span>
            <span class="text-xs font-medium text-slate-800 truncate group-hover:text-emerald-950">
              {{ coa.nama }}
            </span>
          </div>

          <span class="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0 font-bold text-emerald-700">
            Pilih Ini &rarr;
          </span>
        </div>

        <div v-if="filteredCOAs.length === 0" class="p-8 text-center text-slate-400 text-xs">
          Tidak ada POS yang cocok dengan kata kunci "<span class="font-bold">{{ searchQuery }}</span>".
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-2 border-t border-slate-100 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer"
        >
          Batal
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { formatIDR } from '../utils/formatters.js';

const props = defineProps({
  isOpen: Boolean,
  targetIds: {
    type: Array,
    default: () => []
  },
  singleTransaction: {
    type: Object,
    default: null
  },
  coaList: Array
});

const emit = defineEmits(['close', 'select-coa']);

const isBatch = computed(() => props.targetIds && props.targetIds.length > 1);
const searchQuery = ref('');
const searchInputRef = ref(null);

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      searchQuery.value = '';
      nextTick(() => {
        if (searchInputRef.value) searchInputRef.value.focus();
      });
    }
  }
);

const filteredCOAs = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return props.coaList || [];
  return (props.coaList || []).filter(
    c => c.kode.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q)
  );
});

function selectCoa(kode) {
  emit('select-coa', {
    transactionIds: props.targetIds.length > 0 ? props.targetIds : (props.singleTransaction ? [props.singleTransaction.id] : []),
    newCode: kode
  });
}
</script>