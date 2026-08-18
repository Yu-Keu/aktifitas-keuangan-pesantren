<!-- src/components/TabDaftarUlang.vue -->
<template>
  <div class="space-y-6">
    
    <!-- Top Action Header -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Modul Daftar Ulang
          </span>
        </div>
        <h2 class="text-base font-bold text-slate-900">Skema Tarif & Rincian Pembagian Daftar Ulang</h2>
        <p class="text-xs text-slate-500 mt-0.5 max-w-2xl">
          Sistem otomatis mengalirkan nominal yang telah dibayar santri ke pos tertinggi terlebih dahulu (Waterfall).
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          @click="handleAddNewPreset"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
        >
          <span>➕</span> Tambah Skema Tarif Baru
        </button>
      </div>
    </div>

    <!-- WIDGET RINGKASAN REKONSILIASI -->
    <div v-if="studentMasterList.length > 0" class="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Santri Terdata</span>
        <span class="text-lg font-mono font-bold text-slate-900">{{ studentMasterList.length }} Santri</span>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tagihan Master</span>
        <span class="text-lg font-mono font-bold text-slate-900">{{ formatIDR(totalTagihanMaster) }}</span>
      </div>

      <div class="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
        <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Total Alokasi Dibayar (Klop ✓)</span>
        <span class="text-lg font-mono font-bold text-emerald-900">{{ formatIDR(totalDibayarAlokasi) }}</span>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Belum Lunas</span>
        <span class="text-lg font-mono font-bold text-amber-700">{{ formatIDR(totalSisaBelumLunas) }}</span>
      </div>
    </div>

    <!-- 1. TABEL RINCIAN SELURUH SANTRI -->
    <div v-if="fullBreakdownRows.length > 0" class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Data Rincian Daftar Ulang Seluruh Santri ({{ fullBreakdownRows.length }} Baris Pos)
          </h3>
          <p class="text-[11px] text-slate-500">Hasil pemecahan alokasi murni per santri berdasarkan nominal yang sudah dibayar.</p>
        </div>

        <input
          type="text"
          v-model="studentSearch"
          placeholder="Cari santri / NIS / kelas..."
          class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-slate-50 outline-none focus:bg-white focus:border-emerald-500 w-64 font-medium"
        />
      </div>

      <div class="overflow-x-auto border border-slate-200 rounded-xl max-h-[380px]">
        <table class="min-w-full text-xs divide-y divide-slate-200">
          <thead class="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10">
            <tr>
              <th class="px-3 py-2 text-center w-12">No</th>
              <th class="px-3 py-2 text-left w-28">No. Induk</th>
              <th class="px-3 py-2 text-left">Nama Siswa</th>
              <th class="px-3 py-2 text-center w-14">L/P</th>
              <th class="px-3 py-2 text-left w-32">Kelas</th>
              <th class="px-3 py-2 text-left">Pos Alokasi</th>
              <th class="px-3 py-2 text-right w-36">Nominal Pembayaran</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
            <tr v-for="(r, idx) in filteredStudentRows" :key="idx" class="hover:bg-slate-50">
              <td class="px-3 py-1.5 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
              <td class="px-3 py-1.5 font-mono text-slate-600">{{ r.nis || '-' }}</td>
              <td class="px-3 py-1.5 font-bold text-slate-900">{{ r.nama }}</td>
              <td class="px-3 py-1.5 text-center font-bold text-slate-500">{{ r.jk }}</td>
              <td class="px-3 py-1.5 text-slate-600">{{ r.kelas }}</td>
              <td class="px-3 py-1.5 text-emerald-900 font-semibold">{{ r.posName }}</td>
              <td class="px-3 py-1.5 text-right font-mono font-bold" :class="r.amount > 0 ? 'text-slate-900' : 'text-slate-400'">
                {{ formatIDR(r.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 2. MASTER SKEMA TARIF & URUTAN PRIORITAS WATERFALL -->
    <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Daftar Skema Tarif & Urutan Prioritas Waterfall ({{ presets.length }} Skema)
          </h3>
          <p class="text-[11px] text-slate-500">Urutan nomor pos dari atas ke bawah menentukan pos mana yang terisi lebih dulu.</p>
        </div>
        <button
          @click="handleReset"
          class="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 transition cursor-pointer"
        >
          Reset ke Bawaan PIT
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div
          v-for="(preset, pIdx) in presets"
          :key="preset.id || pIdx"
          class="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition"
        >
          <!-- Skema Header -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-2.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center">
                {{ pIdx + 1 }}
              </span>
              
              <input
                type="text"
                v-model="preset.name"
                class="font-bold text-xs text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:border-emerald-500 outline-none w-64 sm:w-80"
                placeholder="Nama Skema Tarif..."
              />

              <!-- Pilihan Jenjang & Kategori Khusus (AGK / PAUD / MI / MTS / MA) -->
              <select
                v-model="preset.jenjang"
                class="text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700 cursor-pointer"
              >
                <option value="PAUD">PAUD / RA</option>
                <option value="MI">MI</option>
                <option value="MTS">MTS</option>
                <option value="MA">MA</option>
                <option value="AGK">AGK (Anak Guru & Karyawan)</option>
                <option value="KHUSUS">Khusus / PHL / GTT</option>
              </select>
            </div>

            <!-- Target Tarif & Aksi Skema -->
            <div class="flex items-center gap-3 text-xs">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] text-slate-400 font-semibold uppercase">Target Tagihan:</span>
                <input
                  type="number"
                  v-model.number="preset.nominal"
                  class="w-28 text-right font-mono font-bold text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
                />
              </div>

              <span
                class="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md"
                :class="calculateSum(preset) === preset.nominal ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
              >
                Rincian: {{ formatIDR(calculateSum(preset)) }}
              </span>

              <button
                @click="addItem(preset)"
                class="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
              >
                + Pos
              </button>

              <button
                @click="handleDeletePreset(preset)"
                class="text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded-lg font-bold transition cursor-pointer"
                title="Hapus skema tarif ini"
              >
                Hapus
              </button>
            </div>
          </div>

          <!-- Tabel Pos Rincian & Prioritas Waterfall -->
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead class="text-slate-400 font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th class="text-center py-1 w-16">Prioritas</th>
                  <th class="text-left py-1">Nama Pos Alokasi</th>
                  <th class="text-center py-1 w-28">Kode COA</th>
                  <th class="text-right py-1 w-36">Nominal (Rp)</th>
                  <th class="text-center py-1 w-14">Hapus</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200/60 text-slate-700">
                <tr v-for="(item, iIdx) in preset.items" :key="item.id || iIdx" class="hover:bg-white/80">
                  <td class="py-1 text-center whitespace-nowrap">
                    <div class="inline-flex items-center gap-0.5">
                      <button
                        :disabled="iIdx === 0"
                        @click="moveItem(preset, iIdx, -1)"
                        class="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer text-[10px] font-bold"
                        title="Naikkan Prioritas"
                      >▲</button>
                      <span class="font-mono text-[11px] font-bold text-slate-600 w-4 text-center">{{ iIdx + 1 }}</span>
                      <button
                        :disabled="iIdx === preset.items.length - 1"
                        @click="moveItem(preset, iIdx, 1)"
                        class="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer text-[10px] font-bold"
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
                      class="w-20 text-center font-mono font-bold text-emerald-800 bg-white border border-slate-200 rounded px-1 py-0.5 outline-none"
                    />
                  </td>

                  <td class="py-1 text-right">
                    <input
                      type="number"
                      v-model.number="item.amount"
                      class="w-28 text-right font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:border-emerald-500"
                    />
                  </td>

                  <td class="py-1 text-center">
                    <button
                      v-if="preset.items.length > 1"
                      @click="removeItem(preset, iIdx)"
                      class="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 cursor-pointer"
                    >✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDaftarUlang } from '../composables/useDaftarUlang.js';
import { useFinance } from '../composables/useFinance.js';
import { formatIDR } from '../utils/formatters.js';

const {
  presets,
  studentMasterList,
  fullBreakdownRows,
  savePresets,
  resetToDefault,
  createNewPreset,
  removePreset
} = useDaftarUlang();

const { exportDaftarUlangExcel } = useFinance();

const studentSearch = ref('');

const totalTagihanMaster = computed(() => {
  return studentMasterList.value.reduce((sum, s) => sum + (Number(s.tagihan) || 0), 0);
});

const totalDibayarAlokasi = computed(() => {
  return fullBreakdownRows.value.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
});

const totalSisaBelumLunas = computed(() => {
  return studentMasterList.value.reduce((sum, s) => sum + (Number(s.sisa) || 0), 0);
});

const filteredStudentRows = computed(() => {
  const q = studentSearch.value.toLowerCase().trim();
  if (!q) return fullBreakdownRows.value;
  return fullBreakdownRows.value.filter(r =>
    (r.nama || '').toLowerCase().includes(q) ||
    (r.nis || '').toLowerCase().includes(q) ||
    (r.kelas || '').toLowerCase().includes(q) ||
    (r.posName || '').toLowerCase().includes(q)
  );
});

function calculateSum(preset) {
  return (preset.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
}

function handleAddNewPreset() {
  createNewPreset();
}

function handleDeletePreset(preset) {
  if (confirm(`Hapus skema tarif "${preset.name}"?`)) {
    removePreset(preset.id);
  }
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

function handleReset() {
  if (confirm('Kembalikan semua skema dan urutan prioritas ke default bawaan PIT?')) {
    resetToDefault();
  }
}
</script>