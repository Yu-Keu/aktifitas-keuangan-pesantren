<template>
  <div class="bg-white border border-slate-300 rounded-lg p-6 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
    
    <!-- Top Action Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 print:hidden text-xs">
      <div class="flex items-center gap-3">
        <label class="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 select-none">
          <input type="checkbox" v-model="hideZeroRows" class="rounded border-slate-300 text-slate-800 focus:ring-0 cursor-pointer" />
          <span>Sembunyikan Pos Rp 0</span>
        </label>
        <span class="text-slate-400">|</span>
        <span class="text-slate-500 font-medium hidden sm:inline">
          💡 Klik baris pos akun untuk membuka rincian transaksi & reassign/split
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="$emit('export-excel')"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
        >
          <span>📊</span> Download Excel (Multi-Sheet)
        </button>
        <button
          @click="$emit('open-upload')"
          class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer"
        >
          Ganti Periode & File
        </button>
        <button
          @click="printWindow"
          class="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-md font-semibold transition cursor-pointer"
        >
          🖨 Cetak
        </button>
      </div>
    </div>

    <!-- Header Laporan -->
    <div class="text-center py-2 space-y-0.5">
      <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wide">LAPORAN AKTIFITAS</h2>
      <h3 class="text-xs font-semibold text-slate-800">Pesantren Ibnu Taimiyah Bogor</h3>
      <p class="text-[11px] text-slate-500 font-medium">Bulan : {{ activePeriod }}</p>
    </div>

    <!-- Tabel Lembar Laporan Standar Akuntansi -->
    <div class="overflow-x-auto border border-slate-300 rounded print:border-slate-400">
      <table class="min-w-full text-xs divide-y divide-slate-200">
        <thead class="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
          <tr>
            <th class="px-3 py-2 text-left w-1/3">Kategori / Pos Akun</th>
            <th class="px-2 py-2 text-center w-20">Kode</th>
            <th class="px-3 py-2 text-left">Rincian Pos</th>
            <th class="px-3 py-2 text-right w-32">Rincian (Rp)</th>
            <th class="px-3 py-2 text-right w-36">Subtotal (Rp)</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-100 bg-white">
          <!-- A. PENERIMAAN -->
          <tr class="bg-slate-200/90 font-bold text-slate-900">
            <td colspan="5" class="px-3 py-1.5 uppercase text-[11px]">A. PENERIMAAN</td>
          </tr>

          <!-- A.1 Penerimaan Rutin -->
          <tr class="bg-slate-100 font-semibold text-slate-800">
            <td colspan="5" class="px-3 py-1.5 text-[10px] uppercase">A.1 PENERIMAAN RUTIN</td>
          </tr>
          
          <template v-for="group in filteredA1Groups" :key="group.name">
            <tr
              v-if="group.items.length === 1"
              @click="$emit('select-detail', group.items[0])"
              class="hover:bg-emerald-50/60 cursor-pointer transition group"
              title="Klik untuk membuka rincian pos ini"
            >
              <td class="px-3 py-1.5 font-medium text-slate-800 group-hover:text-emerald-900">
                <span class="inline-flex items-center gap-1">
                  {{ group.name }}
                  <span class="text-[9px] text-emerald-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                </span>
              </td>
              <td class="px-2 py-1.5 text-center font-mono text-slate-600 group-hover:text-emerald-700 font-semibold">{{ group.items[0].code }}</td>
              <td class="px-3 py-1.5 text-slate-600 group-hover:text-slate-900">{{ group.items[0].desc }}</td>
              <td class="px-3 py-1.5 text-right font-mono text-slate-700">
                {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
              </td>
              <td class="px-3 py-1.5 text-right font-mono text-slate-900 font-bold group-hover:text-emerald-900">
                {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
              </td>
            </tr>

            <template v-else>
              <tr class="bg-slate-50/60 font-semibold text-slate-800 border-t border-slate-200">
                <td colspan="3" class="px-3 py-1.5 text-slate-900">{{ group.name }}</td>
                <td class="px-3 py-1.5 text-right text-slate-300">-</td>
                <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                  {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                </td>
              </tr>
              <tr
                v-for="item in group.items"
                :key="item.code"
                @click="$emit('select-detail', item)"
                class="hover:bg-emerald-50/60 cursor-pointer transition text-[11px] group"
                title="Klik untuk membuka rincian pos ini"
              >
                <td class="px-3 py-1 pl-6 text-slate-400 group-hover:text-emerald-500">↳</td>
                <td class="px-2 py-1 text-center font-mono text-slate-600 group-hover:text-emerald-700 font-semibold">{{ item.code }}</td>
                <td class="px-3 py-1 text-slate-700 group-hover:text-emerald-950 font-medium">
                  <span class="inline-flex items-center gap-1">
                    {{ item.desc }}
                    <span class="text-[9px] text-emerald-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                  </span>
                </td>
                <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-emerald-900 font-bold">
                  {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                </td>
                <td class="px-3 py-1 text-right text-slate-300">-</td>
              </tr>
            </template>
          </template>

          <tr class="font-bold text-slate-900 bg-slate-100/70 border-t border-slate-200">
            <td colspan="3" class="px-3 py-1.5 italic">Total Penerimaan Rutin</td>
            <td class="px-3 py-1.5 text-right text-slate-300">-</td>
            <td class="px-3 py-1.5 text-right font-mono font-bold">{{ formatIDR(sumIncomeRutin) }}</td>
          </tr>

          <!-- A.2 Penerimaan Tidak Rutin -->
          <tr class="bg-slate-100 font-semibold text-slate-800">
            <td colspan="5" class="px-3 py-1.5 text-[10px] uppercase">A.2 PENERIMAAN TIDAK RUTIN</td>
          </tr>

          <template v-for="group in filteredA2Groups" :key="group.name">
            <tr
              v-if="group.items.length === 1"
              @click="$emit('select-detail', group.items[0])"
              class="hover:bg-emerald-50/60 cursor-pointer transition group"
              title="Klik untuk membuka rincian pos ini"
            >
              <td class="px-3 py-1.5 font-medium text-slate-800 group-hover:text-emerald-900">
                <span class="inline-flex items-center gap-1">
                  {{ group.name }}
                  <span class="text-[9px] text-emerald-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                </span>
              </td>
              <td class="px-2 py-1.5 text-center font-mono text-slate-600 group-hover:text-emerald-700 font-semibold">{{ group.items[0].code }}</td>
              <td class="px-3 py-1.5 text-slate-600 group-hover:text-slate-900">{{ group.items[0].desc }}</td>
              <td class="px-3 py-1.5 text-right font-mono text-slate-700">
                {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
              </td>
              <td class="px-3 py-1.5 text-right font-mono text-slate-900 font-bold group-hover:text-emerald-900">
                {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
              </td>
            </tr>

            <template v-else>
              <tr class="bg-slate-50/60 font-semibold text-slate-800 border-t border-slate-200">
                <td colspan="3" class="px-3 py-1.5 text-slate-900">{{ group.name }}</td>
                <td class="px-3 py-1.5 text-right text-slate-300">-</td>
                <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                  {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                </td>
              </tr>
              <tr
                v-for="item in group.items"
                :key="item.code"
                @click="$emit('select-detail', item)"
                class="hover:bg-emerald-50/60 cursor-pointer transition text-[11px] group"
                title="Klik untuk membuka rincian pos ini"
              >
                <td class="px-3 py-1 pl-6 text-slate-400 group-hover:text-emerald-500">↳</td>
                <td class="px-2 py-1 text-center font-mono text-slate-600 group-hover:text-emerald-700 font-semibold">{{ item.code }}</td>
                <td class="px-3 py-1 text-slate-700 group-hover:text-emerald-950 font-medium">
                  <span class="inline-flex items-center gap-1">
                    {{ item.desc }}
                    <span class="text-[9px] text-emerald-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                  </span>
                </td>
                <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-emerald-900 font-bold">
                  {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                </td>
                <td class="px-3 py-1 text-right text-slate-300">-</td>
              </tr>
            </template>
          </template>

          <tr class="font-bold text-slate-900 bg-slate-100/70 border-t border-slate-200">
            <td colspan="3" class="px-3 py-1.5 italic">Total Penerimaan Tidak Rutin</td>
            <td class="px-3 py-1.5 text-right text-slate-300">-</td>
            <td class="px-3 py-1.5 text-right font-mono font-bold">{{ formatIDR(sumIncomeNonRutin) }}</td>
          </tr>

          <!-- GRAND TOTAL PENERIMAAN -->
          <tr class="bg-slate-200 font-bold text-slate-900 border-t-2 border-b-2 border-slate-400">
            <td colspan="3" class="px-3 py-2 uppercase">TOTAL PENERIMAAN (A)</td>
            <td class="px-3 py-2 text-right font-mono font-bold">{{ formatIDR(grandTotalIncome) }}</td>
            <td class="px-3 py-2 text-right font-mono font-bold">{{ formatIDR(grandTotalIncome) }}</td>
          </tr>

          <tr class="h-2 bg-slate-50"><td colspan="5"></td></tr>

          <!-- B. BEBAN -->
          <tr class="bg-slate-200/90 font-bold text-slate-900">
            <td colspan="5" class="px-3 py-1.5 uppercase text-[11px]">B. BEBAN</td>
          </tr>

          <!-- B.1 Beban Rutin -->
          <tr class="bg-slate-100 font-semibold text-slate-800">
            <td colspan="5" class="px-3 py-1.5 text-[10px] uppercase">B.1 BEBAN RUTIN</td>
          </tr>

          <template v-for="group in filteredB1Groups" :key="group.name">
            <tr
              v-if="group.items.length === 1"
              @click="$emit('select-detail', group.items[0])"
              class="hover:bg-rose-50/60 cursor-pointer transition group"
              title="Klik untuk membuka rincian pos ini"
            >
              <td class="px-3 py-1.5 font-medium text-slate-800 group-hover:text-rose-900">
                <span class="inline-flex items-center gap-1">
                  {{ group.name }}
                  <span class="text-[9px] text-rose-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                </span>
              </td>
              <td class="px-2 py-1.5 text-center font-mono text-slate-600 group-hover:text-rose-700 font-semibold">{{ group.items[0].code }}</td>
              <td class="px-3 py-1.5 text-slate-600 group-hover:text-slate-900">{{ group.items[0].desc }}</td>
              <td class="px-3 py-1.5 text-right font-mono text-slate-700">
                {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
              </td>
              <td class="px-3 py-1.5 text-right font-mono text-slate-900 font-bold group-hover:text-rose-900">
                {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
              </td>
            </tr>

            <template v-else>
              <tr class="bg-slate-50/60 font-semibold text-slate-800 border-t border-slate-200">
                <td colspan="3" class="px-3 py-1.5 text-slate-900">{{ group.name }}</td>
                <td class="px-3 py-1.5 text-right text-slate-300">-</td>
                <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                  {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                </td>
              </tr>
              <tr
                v-for="item in group.items"
                :key="item.code"
                @click="$emit('select-detail', item)"
                class="hover:bg-rose-50/60 cursor-pointer transition text-[11px] group"
                title="Klik untuk membuka rincian pos ini"
              >
                <td class="px-3 py-1 pl-6 text-slate-400 group-hover:text-rose-500">↳</td>
                <td class="px-2 py-1 text-center font-mono text-slate-600 group-hover:text-rose-700 font-semibold">{{ item.code }}</td>
                <td class="px-3 py-1 text-slate-700 group-hover:text-rose-950 font-medium">
                  <span class="inline-flex items-center gap-1">
                    {{ item.desc }}
                    <span class="text-[9px] text-rose-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                  </span>
                </td>
                <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-rose-900 font-bold">
                  {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                </td>
                <td class="px-3 py-1 text-right text-slate-300">-</td>
              </tr>
            </template>
          </template>

          <tr class="font-bold text-slate-900 bg-slate-100/70 border-t border-slate-200">
            <td colspan="3" class="px-3 py-1.5 italic">Total Beban Rutin</td>
            <td class="px-3 py-1.5 text-right text-slate-300">-</td>
            <td class="px-3 py-1.5 text-right font-mono font-bold">{{ formatIDR(sumExpenseRutin) }}</td>
          </tr>

          <!-- B.2 Beban Tidak Rutin -->
          <tr class="bg-slate-100 font-semibold text-slate-800">
            <td colspan="5" class="px-3 py-1.5 text-[10px] uppercase">B.2 BEBAN TIDAK RUTIN</td>
          </tr>

          <template v-for="group in filteredB2Groups" :key="group.name">
            <tr
              v-if="group.items.length === 1"
              @click="$emit('select-detail', group.items[0])"
              class="hover:bg-rose-50/60 cursor-pointer transition group"
              title="Klik untuk membuka rincian pos ini"
            >
              <td class="px-3 py-1.5 font-medium text-slate-800 group-hover:text-rose-900">
                <span class="inline-flex items-center gap-1">
                  {{ group.name }}
                  <span class="text-[9px] text-rose-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                </span>
              </td>
              <td class="px-2 py-1.5 text-center font-mono text-slate-600 group-hover:text-rose-700 font-semibold">{{ group.items[0].code }}</td>
              <td class="px-3 py-1.5 text-slate-600 group-hover:text-slate-900">{{ group.items[0].desc }}</td>
              <td class="px-3 py-1.5 text-right font-mono text-slate-700">
                {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
              </td>
              <td class="px-3 py-1.5 text-right font-mono text-slate-900 font-bold group-hover:text-rose-900">
                {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
              </td>
            </tr>

            <template v-else>
              <tr class="bg-slate-50/60 font-semibold text-slate-800 border-t border-slate-200">
                <td colspan="3" class="px-3 py-1.5 text-slate-900">{{ group.name }}</td>
                <td class="px-3 py-1.5 text-right text-slate-300">-</td>
                <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                  {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                </td>
              </tr>
              <tr
                v-for="item in group.items"
                :key="item.code"
                @click="$emit('select-detail', item)"
                class="hover:bg-rose-50/60 cursor-pointer transition text-[11px] group"
                title="Klik untuk membuka rincian pos ini"
              >
                <td class="px-3 py-1 pl-6 text-slate-400 group-hover:text-rose-500">↳</td>
                <td class="px-2 py-1 text-center font-mono text-slate-600 group-hover:text-rose-700 font-semibold">{{ item.code }}</td>
                <td class="px-3 py-1 text-slate-700 group-hover:text-rose-950 font-medium">
                  <span class="inline-flex items-center gap-1">
                    {{ item.desc }}
                    <span class="text-[9px] text-rose-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                  </span>
                </td>
                <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-rose-900 font-bold">
                  {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                </td>
                <td class="px-3 py-1 text-right text-slate-300">-</td>
              </tr>
            </template>
          </template>

          <tr class="font-bold text-slate-900 bg-slate-100/70 border-t border-slate-200">
            <td colspan="3" class="px-3 py-1.5 italic">Total Beban Tidak Rutin</td>
            <td class="px-3 py-1.5 text-right text-slate-300">-</td>
            <td class="px-3 py-1.5 text-right font-mono font-bold">{{ formatIDR(sumExpenseNonRutin) }}</td>
          </tr>

          <!-- GRAND TOTAL BEBAN -->
          <tr class="bg-slate-200 font-bold text-slate-900 border-t-2 border-b-2 border-slate-400">
            <td colspan="3" class="px-3 py-2 uppercase">TOTAL BEBAN (B)</td>
            <td class="px-3 py-2 text-right font-mono font-bold">{{ formatIDR(grandTotalExpense) }}</td>
            <td class="px-3 py-2 text-right font-mono font-bold">{{ formatIDR(grandTotalExpense) }}</td>
          </tr>

          <tr class="h-2 bg-slate-50"><td colspan="5"></td></tr>

          <!-- SURPLUS / DEFISIT -->
          <tr class="bg-slate-300 font-bold text-slate-900 border-t-2 border-b-4 border-double border-slate-700">
            <td colspan="3" class="px-3 py-2.5 uppercase">SURPLUS (DEFISIT) BULAN INI</td>
            <td class="px-3 py-2.5 text-right font-mono font-bold">{{ formatIDR(surplusDeficit) }}</td>
            <td class="px-3 py-2.5 text-right font-mono font-bold">{{ formatIDR(surplusDeficit) }}</td>
          </tr>

        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatIDR } from '../utils/formatters.js';

const props = defineProps({
  structure: Object,
  activePeriod: String,
  getCodeSum: Function,
  sumIncomeRutin: Number,
  sumIncomeNonRutin: Number,
  grandTotalIncome: Number,
  sumExpenseRutin: Number,
  sumExpenseNonRutin: Number,
  grandTotalExpense: Number,
  surplusDeficit: Number
});

defineEmits(['open-upload', 'select-detail', 'export-excel']);

const hideZeroRows = ref(false);

function getGroupTotal(group) {
  return group.items.reduce((sum, item) => sum + props.getCodeSum(item.code), 0);
}

function filterGroups(groups = []) {
  if (!hideZeroRows.value) return groups;
  return groups.filter(g => getGroupTotal(g) !== 0);
}

const filteredA1Groups = computed(() => filterGroups(props.structure.penerimaanRutin?.groups || []));
const filteredA2Groups = computed(() => filterGroups(props.structure.penerimaanTidakRutin?.groups || []));
const filteredB1Groups = computed(() => filterGroups(props.structure.bebanRutin?.groups || []));
const filteredB2Groups = computed(() => filterGroups(props.structure.bebanTidakRutin?.groups || []));

function printWindow() {
  window.print();
}
</script>