<template>
  <div v-if="isOpen && transaction" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 class="font-bold text-slate-900 text-sm">Split / Pecah Pos Transaksi</h3>
          <p class="text-xs text-slate-500 mt-0.5">Alokasikan satu transaksi ke beberapa pos / COA yang berbeda.</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer">✕</button>
      </div>

      <!-- Info Asal -->
      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
        <div class="flex justify-between">
          <span class="text-slate-500">Uraian Asal:</span>
          <span class="font-semibold text-slate-800 text-right max-w-xs truncate">{{ transaction.desc }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Nominal Total Asal:</span>
          <span class="font-mono font-bold text-emerald-700">{{ formatIDR(transaction.amount) }}</span>
        </div>
      </div>

      <!-- Form Split Items -->
      <div class="space-y-3 overflow-y-auto pr-1 flex-1">
        <div
          v-for="(item, idx) in splitItems"
          :key="idx"
          class="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 relative"
        >
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-600 uppercase">Alokasi #{{ idx + 1 }}</span>
            <button
              v-if="splitItems.length > 2"
              @click="removeSplitItem(idx)"
              class="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
            >
              Hapus
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 mb-1">COA Tujuan</label>
              <select
                v-model="item.code"
                class="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-xs font-semibold outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option v-for="coa in coaList" :key="coa.kode" :value="coa.kode">
                  {{ coa.kode }} - {{ coa.nama }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-semibold text-slate-500 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                v-model.number="item.amount"
                class="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-mono text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-semibold text-slate-500 mb-1">Keterangan Alokasi</label>
            <input
              type="text"
              v-model="item.desc"
              class="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-emerald-500"
              placeholder="Keterangan alokasi..."
            />
          </div>
        </div>

        <button
          @click="addSplitItem"
          class="w-full py-2 border border-dashed border-emerald-400 hover:bg-emerald-50/50 text-emerald-700 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          + Tambah Alokasi Pos
        </button>
      </div>

      <!-- Footer Validasi & Aksi -->
      <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="text-slate-500">Total Alokasi:</span>
            <span class="font-mono font-bold" :class="isMatch ? 'text-emerald-700' : 'text-rose-600'">
              {{ formatIDR(totalSplitAmount) }}
            </span>
          </div>
          <p v-if="!isMatch" class="text-[11px] font-semibold text-rose-600">
            Selisih: {{ formatIDR(transaction.amount - totalSplitAmount) }} (Harus Rp 0)
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="$emit('close')"
            class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="handleConfirm"
            :disabled="!isMatch"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            Simpan Hasil Split
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { formatIDR } from '../utils/formatters.js';

const props = defineProps({
  isOpen: Boolean,
  transaction: Object,
  coaList: Array
});

const emit = defineEmits(['close', 'save-split']);

const splitItems = ref([]);

watch(
  () => props.transaction,
  (t) => {
    if (!t) return;
    const half = Math.floor(t.amount / 2);
    splitItems.value = [
      { code: t.code, amount: half, desc: t.desc },
      { code: t.code, amount: t.amount - half, desc: `${t.desc} (Pecahan 2)` }
    ];
  },
  { immediate: true }
);

function addSplitItem() {
  splitItems.value.push({
    code: props.transaction ? props.transaction.code : 'A26',
    amount: 0,
    desc: props.transaction ? `${props.transaction.desc} (Bagian ${splitItems.value.length + 1})` : ''
  });
}

function removeSplitItem(idx) {
  splitItems.value.splice(idx, 1);
}

const totalSplitAmount = computed(() => {
  return splitItems.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

const isMatch = computed(() => {
  if (!props.transaction) return false;
  return Math.abs(totalSplitAmount.value - props.transaction.amount) < 0.01;
});

function handleConfirm() {
  if (!isMatch.value) return;
  emit('save-split', {
    originalId: props.transaction.id,
    splits: splitItems.value
  });
}
</script>