// src/constants/daftarUlangPresets.js

export const DEFAULT_DAFTAR_ULANG_PRESETS = [
  {
    id: "du-agk",
    name: "DAFTAR ULANG AGK",
    nominal: 900000,
    jenjang: "PAUD",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2341", amount: 450000 },
      { id: "i-2", name: "KEGIATAN", code: "A241", amount: 100000 },
      { id: "i-3", name: "SERAGAM", code: "A237", amount: 350000 }
    ]
  },
  {
    id: "du-non-asrama-mi-mts",
    name: "DAFTAR ULANG NON ASRAMA MI KE MTS",
    nominal: 9000000,
    jenjang: "MTS",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2342", amount: 1200000 },
      { id: "i-2", name: "KEGIATAN", code: "A2401", amount: 400000 },
      { id: "i-3", name: "SERAGAM", code: "A236", amount: 1800000 },
      { id: "i-4", name: "DANA PENGEMBANGAN PESANTREN", code: "A238", amount: 500000 },
      { id: "i-5", name: "BANGUNAN", code: "A231", amount: 5000000 },
      { id: "i-6", name: "PERPUSTAKAAN", code: "A2392", amount: 100000 }
    ]
  },
  {
    id: "du-non-asrama-mts-ma",
    name: "DAFTAR ULANG NON ASRAMA MTS KE MA",
    nominal: 4000000,
    jenjang: "MA",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2343", amount: 1200000 },
      { id: "i-2", name: "KEGIATAN", code: "A2402", amount: 400000 },
      { id: "i-3", name: "SERAGAM", code: "A236", amount: 1800000 },
      { id: "i-4", name: "DANA PENGEMBANGAN PESANTREN", code: "A238", amount: 500000 },
      { id: "i-5", name: "PERPUSTAKAAN", code: "A2393", amount: 100000 }
    ]
  },
  {
    id: "du-asrama-mts-ma",
    name: "DAFTAR ULANG ASRAMA MTS KE MA",
    nominal: 4500000,
    jenjang: "MA",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2343", amount: 1200000 },
      { id: "i-2", name: "KEGIATAN", code: "A2402", amount: 400000 },
      { id: "i-3", name: "SERAGAM", code: "A236", amount: 1800000 },
      { id: "i-4", name: "DANA PENGEMBANGAN PESANTREN", code: "A238", amount: 500000 },
      { id: "i-5", name: "PERPUSTAKAAN", code: "A2393", amount: 100000 },
      { id: "i-6", name: "KESEHATAN", code: "A235", amount: 500000 }
    ]
  },
  {
    id: "du-khusus-keysha",
    name: "DAFTAR ULANG KHUSUS KEYSHA AZZAHRA AZWA AL MANSUR",
    nominal: 15635000,
    jenjang: "MTS",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2342", amount: 1200000 },
      { id: "i-2", name: "KEGIATAN", code: "A2401", amount: 400000 },
      { id: "i-3", name: "SERAGAM", code: "A236", amount: 1800000 },
      { id: "i-4", name: "DANA PENGEMBANGAN PESANTREN", code: "A238", amount: 500000 },
      { id: "i-5", name: "BANGUNAN", code: "A231", amount: 5135000 },
      { id: "i-6", name: "PERPUSTAKAAN", code: "A2392", amount: 100000 },
      { id: "i-7", name: "KESEHATAN", code: "A235", amount: 500000 },
      { id: "i-8", name: "PERLENGKAPAN ASRAMA", code: "A232", amount: 6000000 }
    ]
  },
  {
    id: "du-agk-kenaikan",
    name: "DAFTAR ULANG AGK (KENAIKAN KELAS)",
    nominal: 1200000,
    jenjang: "PAUD",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2341", amount: 600000 },
      { id: "i-2", name: "KEGIATAN", code: "A241", amount: 600000 }
    ]
  },
  {
    id: "du-kenaikan-mts",
    name: "DAFTAR ULANG KENAIKAN KELAS MTs",
    nominal: 2400000,
    jenjang: "MTS",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2342", amount: 1200000 },
      { id: "i-2", name: "DANA PENGEMBANGAN PESANTREN", code: "A238", amount: 500000 },
      { id: "i-3", name: "KEGIATAN", code: "A2401", amount: 600000 },
      { id: "i-4", name: "PERPUSTAKAAN", code: "A2392", amount: 100000 }
    ]
  },
  {
    id: "du-kenaikan-ma",
    name: "DAFTAR ULANG KENAIKAN KELAS MA",
    nominal: 2450000,
    jenjang: "MA",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2343", amount: 1250000 },
      { id: "i-2", name: "DANA PENGEMBANGAN PESANTREN", code: "A238", amount: 500000 },
      { id: "i-3", name: "KEGIATAN", code: "A2402", amount: 600000 },
      { id: "i-4", name: "PERPUSTAKAAN", code: "A2393", amount: 100000 }
    ]
  },
  {
    id: "du-kenaikan-mts-asrama",
    name: "DAFTAR ULANG KENAIKAN KELAS MTs ASRAMA",
    nominal: 2900000,
    jenjang: "MTS",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2342", amount: 1200000 },
      { id: "i-2", name: "KESEHATAN", code: "A235", amount: 500000 },
      { id: "i-3", name: "DANA PENGEMBANGAN PESANTREN", code: "A238", amount: 500000 },
      { id: "i-4", name: "KEGIATAN", code: "A2401", amount: 600000 },
      { id: "i-5", name: "PERPUSTAKAAN", code: "A2392", amount: 100000 }
    ]
  },
  {
    id: "du-kenaikan-ma-asrama",
    name: "DAFTAR ULANG KENAIKAN KELAS MA ASRAMA",
    nominal: 2950000,
    jenjang: "MA",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2343", amount: 1250000 },
      { id: "i-2", name: "KESEHATAN", code: "A235", amount: 500000 },
      { id: "i-3", name: "DANA PENGEMBANGAN PESANTREN", code: "A238", amount: 500000 },
      { id: "i-4", name: "KEGIATAN", code: "A2402", amount: 600000 },
      { id: "i-5", name: "PERPUSTAKAAN", code: "A2393", amount: 100000 }
    ]
  },
  {
    id: "du-mi-2",
    name: "DAFTAR ULANG KENAIKAN MI KELAS 2",
    nominal: 580000,
    jenjang: "MI",
    items: [
      { id: "i-1", name: "BUKU MI", code: "A2341", amount: 360000 },
      { id: "i-2", name: "UJIAN MI", code: "A2341", amount: 120000 },
      { id: "i-3", name: "KEGIATAN", code: "A241", amount: 50000 },
      { id: "i-4", name: "PERPUSTAKAAN", code: "A2391", amount: 50000 }
    ]
  },
  {
    id: "du-mi-3",
    name: "DAFTAR ULANG KENAIKAN MI KELAS 3",
    nominal: 620000,
    jenjang: "MI",
    items: [
      { id: "i-1", name: "BUKU MI", code: "A2341", amount: 400000 },
      { id: "i-2", name: "UJIAN MI", code: "A2341", amount: 120000 },
      { id: "i-3", name: "KEGIATAN", code: "A241", amount: 50000 },
      { id: "i-4", name: "PERPUSTAKAAN", code: "A2391", amount: 50000 }
    ]
  },
  {
    id: "du-mi-4",
    name: "DAFTAR ULANG KENAIKAN MI KELAS 4",
    nominal: 700000,
    jenjang: "MI",
    items: [
      { id: "i-1", name: "BUKU MI", code: "A2341", amount: 480000 },
      { id: "i-2", name: "UJIAN MI", code: "A2341", amount: 120000 },
      { id: "i-3", name: "KEGIATAN", code: "A241", amount: 50000 },
      { id: "i-4", name: "PERPUSTAKAAN", code: "A2391", amount: 50000 }
    ]
  },
  {
    id: "du-mi-5",
    name: "DAFTAR ULANG KENAIKAN MI KELAS 5",
    nominal: 675000,
    jenjang: "MI",
    items: [
      { id: "i-1", name: "BUKU MI", code: "A2341", amount: 455000 },
      { id: "i-2", name: "UJIAN MI", code: "A2341", amount: 120000 },
      { id: "i-3", name: "KEGIATAN", code: "A241", amount: 50000 },
      { id: "i-4", name: "PERPUSTAKAAN", code: "A2391", amount: 50000 }
    ]
  },
  {
    id: "du-mi-6",
    name: "DAFTAR ULANG KENAIKAN MI KELAS 6",
    nominal: 685000,
    jenjang: "MI",
    items: [
      { id: "i-1", name: "BUKU MI", code: "A2341", amount: 465000 },
      { id: "i-2", name: "UJIAN MI", code: "A2341", amount: 120000 },
      { id: "i-3", name: "KEGIATAN", code: "A241", amount: 50000 },
      { id: "i-4", name: "PERPUSTAKAAN", code: "A2391", amount: 50000 }
    ]
  },
  {
    id: "du-gtt",
    name: "DAFTAR ULANG GTT",
    nominal: 2951000,
    jenjang: "MTS",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2342", amount: 1200000 },
      { id: "i-2", name: "KEGIATAN", code: "A2401", amount: 400000 },
      { id: "i-3", name: "DANA PENGEMBANGAN PESANTREN", code: "A238", amount: 250000 },
      { id: "i-4", name: "BANGUNAN", code: "A231", amount: 1000000 },
      { id: "i-5", name: "PERPUSTAKAAN", code: "A2392", amount: 100000 },
      { id: "i-6", name: "PEMBULAT", code: "A26", amount: 1000 }
    ]
  },
  {
    id: "du-phl-mts",
    name: "DAFTAR ULANG ANAK KARYAWAN PHL MTS",
    nominal: 1800000,
    jenjang: "MTS",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2342", amount: 1200000 },
      { id: "i-2", name: "KEGIATAN", code: "A2401", amount: 600000 }
    ]
  },
  {
    id: "du-phl-ma",
    name: "DAFTAR ULANG ANAK KARYAWAN PHL MA",
    nominal: 1850000,
    jenjang: "MA",
    items: [
      { id: "i-1", name: "BUKU DAN UJIAN", code: "A2343", amount: 1250000 },
      { id: "i-2", name: "KEGIATAN", code: "A2402", amount: 600000 }
    ]
  },
  {
    id: "du-mi-2-diskon",
    name: "DAFTAR ULANG MI KELAS 2 DENGAN PENGURANGAN",
    nominal: 530000,
    jenjang: "MI",
    items: [
      { id: "i-1", name: "BUKU MI", code: "A2341", amount: 360000 },
      { id: "i-2", name: "UJIAN MI", code: "A2341", amount: 120000 },
      { id: "i-3", name: "KEGIATAN", code: "A241", amount: 50000 }
    ]
  },
  {
    id: "du-mi-3-diskon",
    name: "DAFTAR ULANG MI KELAS 3 DENGAN PENGURANGAN",
    nominal: 570000,
    jenjang: "MI",
    items: [
      { id: "i-1", name: "BUKU MI", code: "A2341", amount: 400000 },
      { id: "i-2", name: "UJIAN MI", code: "A2341", amount: 120000 },
      { id: "i-3", name: "KEGIATAN", code: "A241", amount: 50000 }
    ]
  }
];