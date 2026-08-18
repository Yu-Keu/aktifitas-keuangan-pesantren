<!-- src/components/ActivityReportTable.vue -->
<template>
  <div class="bg-white border border-slate-300 rounded-2xl p-6 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
    
    <!-- Top Action Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 print:hidden text-xs">
      
      <!-- Quick Presets & Filter Tampilan -->
      <div class="flex flex-wrap items-center gap-2.5">
        
        <!-- Mode Switcher -->
        <div class="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            @click="$emit('change-mode', 'single')"
            :class="periodMode === 'single' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900 font-semibold'"
            class="px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <span>⚡</span> Bulan Tunggal
          </button>
          
          <button
            @click="$emit('change-mode', 'academic')"
            :class="periodMode === 'academic' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900 font-semibold'"
            class="px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <span>📅</span> Tahun Ajaran Penuh (Matriks)
          </button>
        </div>

        <!-- Checkbox Filter -->
        <label class="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-600 hover:text-slate-900 select-none ml-2">
          <input type="checkbox" v-model="hideZeroRows" class="rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer" />
          <span>Sembunyikan Pos Rp 0</span>
        </label>

        <label v-if="isMultiMonth" class="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-600 hover:text-slate-900 select-none">
          <input
            type="checkbox"
            :checked="hideEmptyMonthColumns"
            @change="$emit('toggle-empty-months')"
            class="rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer"
          />
          <span>Hanya Bulan Ada Data</span>
        </label>

      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          @click="$emit('export-excel')"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          title="Download Excel Matriks"
        >
          <span>📊</span> Export Excel
        </button>

        <button
          @click="$emit('download-bundle')"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          title="Download Paket ZIP: Excel + Rincian Santri + Backup JSON"
        >
          <span>📦</span> Paket Laporan (.zip)
        </button>

        <button
          @click="printWindow"
          class="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
        >
          🖨 Cetak
        </button>
      </div>
    </div>

    <!-- Header Laporan -->
    <div class="text-center py-2 space-y-0.5">
      <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wide">LAPORAN AKTIFITAS KEUANGAN</h2>
      <h3 class="text-xs font-semibold text-slate-800">Pesantren Ibnu Taimiyah Bogor</h3>
      <p class="text-[11px] text-slate-600 font-semibold">
        Periode : <span class="text-emerald-800 font-bold">{{ activePeriod }}</span>
      </p>
    </div>

    <!-- Tabel Lembar Laporan Matriks / Single Bulan -->
    <div class="overflow-x-auto border border-slate-300 rounded-xl print:border-slate-400">
      <table class="min-w-full text-xs divide-y divide-slate-200">
        
        <!-- THEAD DINAMIS -->
        <thead class="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 sticky top-0 z-10">
          <tr>
            <th class="px-3 py-2 text-left min-w-[220px]">Kategori / Pos Akun</th>
            <th class="px-2 py-2 text-center w-20">Kode</th>
            <th class="px-3 py-2 text-left min-w-[200px]">Rincian Pos</th>

            <!-- Kolom Per Bulan Jika Multi-Month -->
            <template v-if="isMultiMonth">
              <th
                v-for="m in visibleMonths"
                :key="m.key"
                class="px-2.5 py-2 text-right min-w-[100px] font-mono text-[11px] bg-slate-100/90"
              >
                {{ m.label }}
              </th>
              <th class="px-3 py-2 text-right min-w-[125px] font-mono bg-slate-200/80 font-extrabold text-slate-900 border-l border-slate-300">
                Total Konsolidasi
              </th>
            </template>

            <!-- Kolom Standar Single Month -->
            <template v-else>
              <th class="px-3 py-2 text-right w-32">Rincian (Rp)</th>
              <th class="px-3 py-2 text-right w-36">Subtotal (Rp)</th>
            </template>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-100 bg-white">
          
          <!-- ==================== A. PENERIMAAN ==================== -->
          <tr class="bg-slate-200 font-bold text-slate-900">
            <td :colspan="totalColSpan" class="px-3 py-1.5 uppercase text-[11px]">A. PENERIMAAN</td>
          </tr>

          <!-- A.1 Penerimaan Rutin -->
          <tr class="bg-slate-100/90 font-semibold text-slate-800">
            <td :colspan="totalColSpan" class="px-3 py-1.5 text-[10px] uppercase">A.1 PENERIMAAN RUTIN</td>
          </tr>
          
          <template v-for="group in filteredA1Groups" :key="group.name">
            <!-- Case 1: Grup 1 Item -->
            <tr
              v-if="group.items.length === 1"
              @click="$emit('select-detail', group.items[0])"
              class="hover:bg-emerald-50/60 cursor-pointer transition group"
            >
              <td class="px-3 py-1.5 font-medium text-slate-800 group-hover:text-emerald-900">
                <span class="inline-flex items-center gap-1">
                  {{ group.name }}
                  <span class="text-[9px] text-emerald-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                </span>
              </td>
              <td class="px-2 py-1.5 text-center font-mono text-slate-600 group-hover:text-emerald-700 font-semibold">{{ group.items[0].code }}</td>
              <td class="px-3 py-1.5 text-slate-600 group-hover:text-slate-900">{{ group.items[0].desc }}</td>

              <template v-if="isMultiMonth">
                <td
                  v-for="m in visibleMonths"
                  :key="m.key"
                  class="px-2.5 py-1.5 text-right font-mono"
                  :class="getCodeSum(group.items[0].code, m.key) !== 0 ? 'text-slate-700' : 'text-slate-300'"
                >
                  {{ getCodeSum(group.items[0].code, m.key) !== 0 ? formatIDR(getCodeSum(group.items[0].code, m.key)) : '-' }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900 border-l border-slate-200 bg-slate-50/50 group-hover:text-emerald-900">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
              </template>

              <template v-else>
                <td class="px-3 py-1.5 text-right font-mono text-slate-700">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono text-slate-900 font-bold group-hover:text-emerald-900">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
              </template>
            </tr>

            <!-- Case 2: Grup Banyak Item -->
            <template v-else>
              <tr class="bg-slate-50/70 font-semibold text-slate-800 border-t border-slate-200">
                <td colspan="3" class="px-3 py-1.5 text-slate-900">{{ group.name }}</td>

                <template v-if="isMultiMonth">
                  <td
                    v-for="m in visibleMonths"
                    :key="m.key"
                    class="px-2.5 py-1.5 text-right font-mono font-bold"
                    :class="getGroupTotal(group, m.key) !== 0 ? 'text-slate-800' : 'text-slate-300'"
                  >
                    {{ getGroupTotal(group, m.key) !== 0 ? formatIDR(getGroupTotal(group, m.key)) : '-' }}
                  </td>
                  <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900 border-l border-slate-200 bg-slate-100/50">
                    {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                  </td>
                </template>

                <template v-else>
                  <td class="px-3 py-1.5 text-right text-slate-300">-</td>
                  <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                    {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                  </td>
                </template>
              </tr>

              <tr
                v-for="item in group.items"
                :key="item.code"
                @click="$emit('select-detail', item)"
                class="hover:bg-emerald-50/60 cursor-pointer transition text-[11px] group"
              >
                <td class="px-3 py-1 pl-6 text-slate-400 group-hover:text-emerald-500">↳</td>
                <td class="px-2 py-1 text-center font-mono text-slate-600 group-hover:text-emerald-700 font-semibold">{{ item.code }}</td>
                <td class="px-3 py-1 text-slate-700 group-hover:text-emerald-950 font-medium">
                  <span class="inline-flex items-center gap-1">
                    {{ item.desc }}
                    <span class="text-[9px] text-emerald-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                  </span>
                </td>

                <template v-if="isMultiMonth">
                  <td
                    v-for="m in visibleMonths"
                    :key="m.key"
                    class="px-2.5 py-1 text-right font-mono"
                    :class="getCodeSum(item.code, m.key) !== 0 ? 'text-slate-700' : 'text-slate-300'"
                  >
                    {{ getCodeSum(item.code, m.key) !== 0 ? formatIDR(getCodeSum(item.code, m.key)) : '-' }}
                  </td>
                  <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-emerald-900 font-bold border-l border-slate-200 bg-slate-50/30">
                    {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                  </td>
                </template>

                <template v-else>
                  <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-emerald-900 font-bold">
                    {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                  </td>
                  <td class="px-3 py-1 text-right text-slate-300">-</td>
                </template>
              </tr>
            </template>
          </template>

          <!-- Subtotal A1 -->
          <tr class="font-bold text-slate-900 bg-slate-100/80 border-t border-slate-200">
            <td colspan="3" class="px-3 py-1.5 italic">Total Penerimaan Rutin</td>
            <template v-if="isMultiMonth">
              <td v-for="m in visibleMonths" :key="m.key" class="px-2.5 py-1.5 text-right font-mono">
                {{ formatIDR(sumIncomeRutin(m.key)) }}
              </td>
              <td class="px-3 py-1.5 text-right font-mono font-bold border-l border-slate-200 bg-slate-200/50">
                {{ formatIDR(sumIncomeRutin()) }}
              </td>
            </template>
            <template v-else>
              <td class="px-3 py-1.5 text-right text-slate-300">-</td>
              <td class="px-3 py-1.5 text-right font-mono font-bold">{{ formatIDR(sumIncomeRutin()) }}</td>
            </template>
          </tr>

          <!-- A.2 Penerimaan Tidak Rutin -->
          <tr class="bg-slate-100/90 font-semibold text-slate-800">
            <td :colspan="totalColSpan" class="px-3 py-1.5 text-[10px] uppercase">A.2 PENERIMAAN TIDAK RUTIN</td>
          </tr>

          <template v-for="group in filteredA2Groups" :key="group.name">
            <tr
              v-if="group.items.length === 1"
              @click="$emit('select-detail', group.items[0])"
              class="hover:bg-emerald-50/60 cursor-pointer transition group"
            >
              <td class="px-3 py-1.5 font-medium text-slate-800 group-hover:text-emerald-900">
                <span class="inline-flex items-center gap-1">
                  {{ group.name }}
                  <span class="text-[9px] text-emerald-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                </span>
              </td>
              <td class="px-2 py-1.5 text-center font-mono text-slate-600 group-hover:text-emerald-700 font-semibold">{{ group.items[0].code }}</td>
              <td class="px-3 py-1.5 text-slate-600 group-hover:text-slate-900">{{ group.items[0].desc }}</td>

              <template v-if="isMultiMonth">
                <td
                  v-for="m in visibleMonths"
                  :key="m.key"
                  class="px-2.5 py-1.5 text-right font-mono"
                  :class="getCodeSum(group.items[0].code, m.key) !== 0 ? 'text-slate-700' : 'text-slate-300'"
                >
                  {{ getCodeSum(group.items[0].code, m.key) !== 0 ? formatIDR(getCodeSum(group.items[0].code, m.key)) : '-' }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900 border-l border-slate-200 bg-slate-50/50 group-hover:text-emerald-900">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
              </template>

              <template v-else>
                <td class="px-3 py-1.5 text-right font-mono text-slate-700">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono text-slate-900 font-bold group-hover:text-emerald-900">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
              </template>
            </tr>

            <template v-else>
              <tr class="bg-slate-50/70 font-semibold text-slate-800 border-t border-slate-200">
                <td colspan="3" class="px-3 py-1.5 text-slate-900">{{ group.name }}</td>

                <template v-if="isMultiMonth">
                  <td
                    v-for="m in visibleMonths"
                    :key="m.key"
                    class="px-2.5 py-1.5 text-right font-mono font-bold"
                    :class="getGroupTotal(group, m.key) !== 0 ? 'text-slate-800' : 'text-slate-300'"
                  >
                    {{ getGroupTotal(group, m.key) !== 0 ? formatIDR(getGroupTotal(group, m.key)) : '-' }}
                  </td>
                  <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900 border-l border-slate-200 bg-slate-100/50">
                    {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                  </td>
                </template>

                <template v-else>
                  <td class="px-3 py-1.5 text-right text-slate-300">-</td>
                  <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                    {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                  </td>
                </template>
              </tr>

              <tr
                v-for="item in group.items"
                :key="item.code"
                @click="$emit('select-detail', item)"
                class="hover:bg-emerald-50/60 cursor-pointer transition text-[11px] group"
              >
                <td class="px-3 py-1 pl-6 text-slate-400 group-hover:text-emerald-500">↳</td>
                <td class="px-2 py-1 text-center font-mono text-slate-600 group-hover:text-emerald-700 font-semibold">{{ item.code }}</td>
                <td class="px-3 py-1 text-slate-700 group-hover:text-emerald-950 font-medium">
                  <span class="inline-flex items-center gap-1">
                    {{ item.desc }}
                    <span class="text-[9px] text-emerald-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                  </span>
                </td>

                <template v-if="isMultiMonth">
                  <td
                    v-for="m in visibleMonths"
                    :key="m.key"
                    class="px-2.5 py-1 text-right font-mono"
                    :class="getCodeSum(item.code, m.key) !== 0 ? 'text-slate-700' : 'text-slate-300'"
                  >
                    {{ getCodeSum(item.code, m.key) !== 0 ? formatIDR(getCodeSum(item.code, m.key)) : '-' }}
                  </td>
                  <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-emerald-900 font-bold border-l border-slate-200 bg-slate-50/30">
                    {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                  </td>
                </template>

                <template v-else>
                  <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-emerald-900 font-bold">
                    {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                  </td>
                  <td class="px-3 py-1 text-right text-slate-300">-</td>
                </template>
              </tr>
            </template>
          </template>

          <!-- Subtotal A2 -->
          <tr class="font-bold text-slate-900 bg-slate-100/80 border-t border-slate-200">
            <td colspan="3" class="px-3 py-1.5 italic">Total Penerimaan Tidak Rutin</td>
            <template v-if="isMultiMonth">
              <td v-for="m in visibleMonths" :key="m.key" class="px-2.5 py-1.5 text-right font-mono">
                {{ formatIDR(sumIncomeNonRutin(m.key)) }}
              </td>
              <td class="px-3 py-1.5 text-right font-mono font-bold border-l border-slate-200 bg-slate-200/50">
                {{ formatIDR(sumIncomeNonRutin()) }}
              </td>
            </template>
            <template v-else>
              <td class="px-3 py-1.5 text-right text-slate-300">-</td>
              <td class="px-3 py-1.5 text-right font-mono font-bold">{{ formatIDR(sumIncomeNonRutin()) }}</td>
            </template>
          </tr>

          <!-- GRAND TOTAL PENERIMAAN (A) -->
          <tr class="bg-slate-200 font-bold text-slate-900 border-t-2 border-b-2 border-slate-400">
            <td colspan="3" class="px-3 py-2 uppercase">TOTAL PENERIMAAN (A)</td>
            <template v-if="isMultiMonth">
              <td v-for="m in visibleMonths" :key="m.key" class="px-2.5 py-2 text-right font-mono font-bold">
                {{ formatIDR(grandTotalIncome(m.key)) }}
              </td>
              <td class="px-3 py-2 text-right font-mono font-bold border-l border-slate-400 bg-slate-300/60">
                {{ formatIDR(grandTotalIncome()) }}
              </td>
            </template>
            <template v-else>
              <td class="px-3 py-2 text-right font-mono font-bold">{{ formatIDR(grandTotalIncome()) }}</td>
              <td class="px-3 py-2 text-right font-mono font-bold">{{ formatIDR(grandTotalIncome()) }}</td>
            </template>
          </tr>

          <tr class="h-2 bg-slate-50"><td :colspan="totalColSpan"></td></tr>

          <!-- ==================== B. BEBAN ==================== -->
          <tr class="bg-slate-200 font-bold text-slate-900">
            <td :colspan="totalColSpan" class="px-3 py-1.5 uppercase text-[11px]">B. BEBAN</td>
          </tr>

          <!-- B.1 Beban Rutin -->
          <tr class="bg-slate-100/90 font-semibold text-slate-800">
            <td :colspan="totalColSpan" class="px-3 py-1.5 text-[10px] uppercase">B.1 BEBAN RUTIN</td>
          </tr>

          <template v-for="group in filteredB1Groups" :key="group.name">
            <tr
              v-if="group.items.length === 1"
              @click="$emit('select-detail', group.items[0])"
              class="hover:bg-rose-50/60 cursor-pointer transition group"
            >
              <td class="px-3 py-1.5 font-medium text-slate-800 group-hover:text-rose-900">
                <span class="inline-flex items-center gap-1">
                  {{ group.name }}
                  <span class="text-[9px] text-rose-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                </span>
              </td>
              <td class="px-2 py-1.5 text-center font-mono text-slate-600 group-hover:text-rose-700 font-semibold">{{ group.items[0].code }}</td>
              <td class="px-3 py-1.5 text-slate-600 group-hover:text-slate-900">{{ group.items[0].desc }}</td>

              <template v-if="isMultiMonth">
                <td
                  v-for="m in visibleMonths"
                  :key="m.key"
                  class="px-2.5 py-1.5 text-right font-mono"
                  :class="getCodeSum(group.items[0].code, m.key) !== 0 ? 'text-slate-700' : 'text-slate-300'"
                >
                  {{ getCodeSum(group.items[0].code, m.key) !== 0 ? formatIDR(getCodeSum(group.items[0].code, m.key)) : '-' }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900 border-l border-slate-200 bg-slate-50/50 group-hover:text-rose-900">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
              </template>

              <template v-else>
                <td class="px-3 py-1.5 text-right font-mono text-slate-700">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono text-slate-900 font-bold group-hover:text-rose-900">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
              </template>
            </tr>

            <template v-else>
              <tr class="bg-slate-50/70 font-semibold text-slate-800 border-t border-slate-200">
                <td colspan="3" class="px-3 py-1.5 text-slate-900">{{ group.name }}</td>

                <template v-if="isMultiMonth">
                  <td
                    v-for="m in visibleMonths"
                    :key="m.key"
                    class="px-2.5 py-1.5 text-right font-mono font-bold"
                    :class="getGroupTotal(group, m.key) !== 0 ? 'text-slate-800' : 'text-slate-300'"
                  >
                    {{ getGroupTotal(group, m.key) !== 0 ? formatIDR(getGroupTotal(group, m.key)) : '-' }}
                  </td>
                  <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900 border-l border-slate-200 bg-slate-100/50">
                    {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                  </td>
                </template>

                <template v-else>
                  <td class="px-3 py-1.5 text-right text-slate-300">-</td>
                  <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                    {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                  </td>
                </template>
              </tr>

              <tr
                v-for="item in group.items"
                :key="item.code"
                @click="$emit('select-detail', item)"
                class="hover:bg-rose-50/60 cursor-pointer transition text-[11px] group"
              >
                <td class="px-3 py-1 pl-6 text-slate-400 group-hover:text-rose-500">↳</td>
                <td class="px-2 py-1 text-center font-mono text-slate-600 group-hover:text-rose-700 font-semibold">{{ item.code }}</td>
                <td class="px-3 py-1 text-slate-700 group-hover:text-rose-950 font-medium">
                  <span class="inline-flex items-center gap-1">
                    {{ item.desc }}
                    <span class="text-[9px] text-rose-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                  </span>
                </td>

                <template v-if="isMultiMonth">
                  <td
                    v-for="m in visibleMonths"
                    :key="m.key"
                    class="px-2.5 py-1 text-right font-mono"
                    :class="getCodeSum(item.code, m.key) !== 0 ? 'text-slate-700' : 'text-slate-300'"
                  >
                    {{ getCodeSum(item.code, m.key) !== 0 ? formatIDR(getCodeSum(item.code, m.key)) : '-' }}
                  </td>
                  <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-rose-900 font-bold border-l border-slate-200 bg-slate-50/30">
                    {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                  </td>
                </template>

                <template v-else>
                  <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-rose-900 font-bold">
                    {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                  </td>
                  <td class="px-3 py-1 text-right text-slate-300">-</td>
                </template>
              </tr>
            </template>
          </template>

          <!-- Subtotal B1 -->
          <tr class="font-bold text-slate-900 bg-slate-100/80 border-t border-slate-200">
            <td colspan="3" class="px-3 py-1.5 italic">Total Beban Rutin</td>
            <template v-if="isMultiMonth">
              <td v-for="m in visibleMonths" :key="m.key" class="px-2.5 py-1.5 text-right font-mono">
                {{ formatIDR(sumExpenseRutin(m.key)) }}
              </td>
              <td class="px-3 py-1.5 text-right font-mono font-bold border-l border-slate-200 bg-slate-200/50">
                {{ formatIDR(sumExpenseRutin()) }}
              </td>
            </template>
            <template v-else>
              <td class="px-3 py-1.5 text-right text-slate-300">-</td>
              <td class="px-3 py-1.5 text-right font-mono font-bold">{{ formatIDR(sumExpenseRutin()) }}</td>
            </template>
          </tr>

          <!-- B.2 Beban Tidak Rutin -->
          <tr class="bg-slate-100/90 font-semibold text-slate-800">
            <td :colspan="totalColSpan" class="px-3 py-1.5 text-[10px] uppercase">B.2 BEBAN TIDAK RUTIN</td>
          </tr>

          <template v-for="group in filteredB2Groups" :key="group.name">
            <tr
              v-if="group.items.length === 1"
              @click="$emit('select-detail', group.items[0])"
              class="hover:bg-rose-50/60 cursor-pointer transition group"
            >
              <td class="px-3 py-1.5 font-medium text-slate-800 group-hover:text-rose-900">
                <span class="inline-flex items-center gap-1">
                  {{ group.name }}
                  <span class="text-[9px] text-rose-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                </span>
              </td>
              <td class="px-2 py-1.5 text-center font-mono text-slate-600 group-hover:text-rose-700 font-semibold">{{ group.items[0].code }}</td>
              <td class="px-3 py-1.5 text-slate-600 group-hover:text-slate-900">{{ group.items[0].desc }}</td>

              <template v-if="isMultiMonth">
                <td
                  v-for="m in visibleMonths"
                  :key="m.key"
                  class="px-2.5 py-1.5 text-right font-mono"
                  :class="getCodeSum(group.items[0].code, m.key) !== 0 ? 'text-slate-700' : 'text-slate-300'"
                >
                  {{ getCodeSum(group.items[0].code, m.key) !== 0 ? formatIDR(getCodeSum(group.items[0].code, m.key)) : '-' }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900 border-l border-slate-200 bg-slate-50/50 group-hover:text-rose-900">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
              </template>

              <template v-else>
                <td class="px-3 py-1.5 text-right font-mono text-slate-700">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono text-slate-900 font-bold group-hover:text-rose-900">
                  {{ getCodeSum(group.items[0].code) !== 0 ? formatIDR(getCodeSum(group.items[0].code)) : '-' }}
                </td>
              </template>
            </tr>

            <template v-else>
              <tr class="bg-slate-50/70 font-semibold text-slate-800 border-t border-slate-200">
                <td colspan="3" class="px-3 py-1.5 text-slate-900">{{ group.name }}</td>

                <template v-if="isMultiMonth">
                  <td
                    v-for="m in visibleMonths"
                    :key="m.key"
                    class="px-2.5 py-1.5 text-right font-mono font-bold"
                    :class="getGroupTotal(group, m.key) !== 0 ? 'text-slate-800' : 'text-slate-300'"
                  >
                    {{ getGroupTotal(group, m.key) !== 0 ? formatIDR(getGroupTotal(group, m.key)) : '-' }}
                  </td>
                  <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900 border-l border-slate-200 bg-slate-100/50">
                    {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                  </td>
                </template>

                <template v-else>
                  <td class="px-3 py-1.5 text-right text-slate-300">-</td>
                  <td class="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                    {{ getGroupTotal(group) !== 0 ? formatIDR(getGroupTotal(group)) : '-' }}
                  </td>
                </template>
              </tr>

              <tr
                v-for="item in group.items"
                :key="item.code"
                @click="$emit('select-detail', item)"
                class="hover:bg-rose-50/60 cursor-pointer transition text-[11px] group"
              >
                <td class="px-3 py-1 pl-6 text-slate-400 group-hover:text-rose-500">↳</td>
                <td class="px-2 py-1 text-center font-mono text-slate-600 group-hover:text-rose-700 font-semibold">{{ item.code }}</td>
                <td class="px-3 py-1 text-slate-700 group-hover:text-rose-950 font-medium">
                  <span class="inline-flex items-center gap-1">
                    {{ item.desc }}
                    <span class="text-[9px] text-rose-500 opacity-0 group-hover:opacity-100 transition">↗</span>
                  </span>
                </td>

                <template v-if="isMultiMonth">
                  <td
                    v-for="m in visibleMonths"
                    :key="m.key"
                    class="px-2.5 py-1 text-right font-mono"
                    :class="getCodeSum(item.code, m.key) !== 0 ? 'text-slate-700' : 'text-slate-300'"
                  >
                    {{ getCodeSum(item.code, m.key) !== 0 ? formatIDR(getCodeSum(item.code, m.key)) : '-' }}
                  </td>
                  <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-rose-900 font-bold border-l border-slate-200 bg-slate-50/30">
                    {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                  </td>
                </template>

                <template v-else>
                  <td class="px-3 py-1 text-right font-mono text-slate-700 group-hover:text-rose-900 font-bold">
                    {{ getCodeSum(item.code) !== 0 ? formatIDR(getCodeSum(item.code)) : '-' }}
                  </td>
                  <td class="px-3 py-1 text-right text-slate-300">-</td>
                </template>
              </tr>
            </template>
          </template>

          <!-- Subtotal B2 -->
          <tr class="font-bold text-slate-900 bg-slate-100/80 border-t border-slate-200">
            <td colspan="3" class="px-3 py-1.5 italic">Total Beban Tidak Rutin</td>
            <template v-if="isMultiMonth">
              <td v-for="m in visibleMonths" :key="m.key" class="px-2.5 py-1.5 text-right font-mono">
                {{ formatIDR(sumExpenseNonRutin(m.key)) }}
              </td>
              <td class="px-3 py-1.5 text-right font-mono font-bold border-l border-slate-200 bg-slate-200/50">
                {{ formatIDR(sumExpenseNonRutin()) }}
              </td>
            </template>
            <template v-else>
              <td class="px-3 py-1.5 text-right text-slate-300">-</td>
              <td class="px-3 py-1.5 text-right font-mono font-bold">{{ formatIDR(sumExpenseNonRutin()) }}</td>
            </template>
          </tr>

          <!-- GRAND TOTAL BEBAN (B) -->
          <tr class="bg-slate-200 font-bold text-slate-900 border-t-2 border-b-2 border-slate-400">
            <td colspan="3" class="px-3 py-2 uppercase">TOTAL BEBAN (B)</td>
            <template v-if="isMultiMonth">
              <td v-for="m in visibleMonths" :key="m.key" class="px-2.5 py-2 text-right font-mono font-bold">
                {{ formatIDR(grandTotalExpense(m.key)) }}
              </td>
              <td class="px-3 py-2 text-right font-mono font-bold border-l border-slate-400 bg-slate-300/60">
                {{ formatIDR(grandTotalExpense()) }}
              </td>
            </template>
            <template v-else>
              <td class="px-3 py-2 text-right font-mono font-bold">{{ formatIDR(grandTotalExpense()) }}</td>
              <td class="px-3 py-2 text-right font-mono font-bold">{{ formatIDR(grandTotalExpense()) }}</td>
            </template>
          </tr>

          <tr class="h-2 bg-slate-50"><td :colspan="totalColSpan"></td></tr>

          <!-- SURPLUS (DEFISIT) -->
          <tr class="bg-slate-300 font-bold text-slate-900 border-t-2 border-b-4 border-double border-slate-700">
            <td colspan="3" class="px-3 py-2.5 uppercase">SURPLUS (DEFISIT) PERIODE INI</td>
            <template v-if="isMultiMonth">
              <td v-for="m in visibleMonths" :key="m.key" class="px-2.5 py-2.5 text-right font-mono font-bold">
                {{ formatIDR(surplusDeficit(m.key)) }}
              </td>
              <td class="px-3 py-2.5 text-right font-mono font-bold border-l border-slate-700 bg-slate-400/40">
                {{ formatIDR(surplusDeficit()) }}
              </td>
            </template>
            <template v-else>
              <td class="px-3 py-2.5 text-right font-mono font-bold">{{ formatIDR(surplusDeficit()) }}</td>
              <td class="px-3 py-2.5 text-right font-mono font-bold">{{ formatIDR(surplusDeficit()) }}</td>
            </template>
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
  periodMode: String,
  visibleMonths: {
    type: Array,
    default: () => []
  },
  hideEmptyMonthColumns: Boolean,
  getCodeSum: Function,
  getGroupTotal: Function,
  sumIncomeRutin: Function,
  sumIncomeNonRutin: Function,
  grandTotalIncome: Function,
  sumExpenseRutin: Function,
  sumExpenseNonRutin: Function,
  grandTotalExpense: Function,
  surplusDeficit: Function
});

defineEmits([
  'select-detail',
  'export-excel',
  'download-bundle',
  'change-mode',
  'toggle-empty-months'
]);

const hideZeroRows = ref(false);
const isMultiMonth = computed(() => (props.visibleMonths || []).length > 1);

const totalColSpan = computed(() => {
  return isMultiMonth.value ? 3 + props.visibleMonths.length + 1 : 5;
});

function filterGroups(groups = []) {
  if (!hideZeroRows.value) return groups;
  return groups.filter(g => props.getGroupTotal(g) !== 0);
}

const filteredA1Groups = computed(() => filterGroups(props.structure.penerimaanRutin?.groups || []));
const filteredA2Groups = computed(() => filterGroups(props.structure.penerimaanTidakRutin?.groups || []));
const filteredB1Groups = computed(() => filterGroups(props.structure.bebanRutin?.groups || []));
const filteredB2Groups = computed(() => filterGroups(props.structure.bebanTidakRutin?.groups || []));

function printWindow() {
  window.print();
}
</script>