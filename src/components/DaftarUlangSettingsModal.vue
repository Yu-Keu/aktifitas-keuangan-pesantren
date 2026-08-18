<!-- src/components/DaftarUlangSettingsModal.vue -->
<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>⚙️</span> Master Skema & Urutan Prioritas Waterfall Daftar Ulang (T.A 2026/2027)
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Urutan baris dari atas ke bawah menentukan pos mana yang didahulukan saat santri membayar cicilan.
          </p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer">✕</button>
      </div>

      <!-- Action Toolbar -->
      <div class="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <button
            @click="exportPresetsToJSON"
            class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>📥</span> Export JSON
          </button>
          
          <label class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-300">
            <span>📤</span> Import JSON
            <input type="file" accept=".json" class="hidden" @change="handleImportFile" />
          </label>
        </div>

        <button
          @click="handleReset"
          class="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 transition cursor-pointer"
        >
          Kembalikan ke Default PIT
        </button>
      </div>

      <!-- List Presets & Waterfall Reordering -->
      <div class="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
        <div
          v-for="(preset, pIdx) in presets"
          :key="preset.id || pIdx"
          class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition space-y-3"
        >
          <!-- Preset Header -->
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                {{ pIdx + 1 }}
              </span>
              <input
                type="text"
                v-model="preset.name"
                class="font-bold text-xs text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none px-1"
              />
              <span class="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {{ preset.jenjang }}
              </span>
            </div>

            <!-- Total vs Target Tarif Calculation -->
            <div class="flex items-center gap-3 text-xs">
              <div class="text-right">
                <span class="text-[10px] text-slate-400 block font-semibold">Total Rincian:</span>
                <span class="font-mono font-bold" :class="calculateSum(preset) === preset.nominal ? 'text-emerald-700' : 'text-rose-600'">
                  {{ formatIDR(calculateSum(preset)) }} / {{ formatIDR(preset.nominal) }}
                </span>
              </div>
              <button
                @click="addItem(preset)"
                class="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-bold transition cursor-pointer"
              >
                + Tambah Pos
              </button>
            </div>
          </div>

          <!-- Items Table dengan Reordering (Move Up / Down) -->
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead class="text-slate-400 font-semibold text-[11px] border-b border-slate-100">
                <tr>
                  <th class="text-center py-1 w-16">Prioritas</th>
                  <th class="text-left py-1">Nama Pos Alokasi</th>
                  <th class="text-center py-1 w-28">Kode COA</th>
                  <th class="text-right py-1 w-36">Nominal (Rp)</th>
                  <th class="text-center py-1 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="(item, iIdx) in preset.items" :key="item.id || iIdx" class="hover:bg-slate-50/80">
                  
                  <!-- Tombol Urutan (Move Up / Down) -->
                  <td class="py-1 text-center whitespace-nowrap">
                    <div class="inline-flex items-center gap-0.5">
                      <button
                        :disabled="iIdx === 0"
                        @click="moveItem(preset, iIdx, -1)"
                        class="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed text-[10px] font-bold"
                        title="Naikkan Prioritas"
                      >▲</button>
                      <span class="font-mono text-[11px] font-bold text-slate-500 w-4 text-center">{{ iIdx + 1 }}</span>
                      <button
                        :disabled="iIdx === preset.items.length - 1"
                        @click="moveItem(preset, iIdx, 1)"
                        class="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed text-[10px] font-bold"
                        title="Turunkan Prioritas"
                      >▼</button>
                    </div>
                  </td>

                  <td class="py-1">
                    <input
                      type="text"
                      v-model="item.name"
                      class="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none px-1 font-medium"
                    />
                  </td>

                  <td class="py-1 text-center">
                    <input
                      type="text"
                      v-model="item.code"
                      class="w-20 text-center font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 outline-none"
                    />
                  </td>

                  <td class="py-1 text-right">
                    <input
                      type="number"
                      v-model.number="item.amount"
                      class="w-28 text-right font-mono font-bold text-slate-900 border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:border-emerald-500"
                    />
                  </td>

                  <td class="py-1 text-center">
                    <button
                      v-if="preset.items.length > 1"
                      @click="removeItem(preset, iIdx)"
                      class="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 cursor-pointer"
                      title="Hapus pos ini"
                    >✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end">
        <button
          @click="saveAndClose"
          class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition cursor-pointer"
        >
          Simpan Perubahan & Tutup
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useDaftarUlang } from '../composables/useDaftarUlang.js';
import { formatIDR } from '../utils/formatters.js';

defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const {
  presets,
  savePresets,
  resetToDefault,
  exportPresetsToJSON,
  importPresetsFromJSON
} = useDaftarUlang();

function calculateSum(preset) {
  return (preset.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
}

function moveItem(preset, index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= preset.items.length) return;
  const temp = preset.items[index];
  preset.items[index] = preset.items[targetIndex];
  preset.items[targetIndex] = temp;
  savePresets(presets.value);
}

function addItem(preset) {
  preset.items.push({
    id: `item-${Date.now()}`,
    name: 'Pos Baru',
    code: 'A26',
    amount: 0
  });
  savePresets(presets.value);
}

function removeItem(preset, index) {
  preset.items.splice(index, 1);
  savePresets(presets.value);
}

async function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    await importPresetsFromJSON(file);
    alert('Preset Daftar Ulang berhasil diimpor!');
  } catch (err) {
    alert('Gagal mengimpor JSON: ' + err.message);
  }
  e.target.value = '';
}

function handleReset() {
  if (confirm('Kembalikan semua skema dan urutan prioritas ke default bawaan PIT?')) {
    resetToDefault();
  }
}

function saveAndClose() {
  savePresets(presets.value);
  emit('close');
}
</script>