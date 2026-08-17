export const REPORT_STRUCTURE = {
  penerimaanRutin: {
    title: "A.1 PENERIMAAN RUTIN",
    groups: [
      {
        name: "A.1.1. Penerimaan Dari Yys Lajnah",
        items: [{ code: "A11", desc: "Penerimaan dari Yayasan Lajnah" }]
      },
      {
        name: "A.1.2. Penerimaan SPP Santri Non Yatim",
        items: [
          { code: "A121", desc: "Penerimaan SPP PAUD" },
          { code: "A122", desc: "Penerimaan SPP MI" },
          { code: "A1231", desc: "Penerimaan SPP MTs Non Asrama" },
          { code: "A1232", desc: "Penerimaan SPP MTs Asrama" },
          { code: "A1233", desc: "Penerimaan SPP MA Non Asrama" },
          { code: "A1234", desc: "Penerimaan SPP MA Asrama" }
        ]
      },
      {
        name: "A.1.4. Penerimaan BOS",
        items: [
          { code: "A141", desc: "BOS MI" },
          { code: "A142", desc: "BOS MTS" },
          { code: "A143", desc: "BOS MA" }
        ]
      },
      {
        name: "A.1.5. Penerimaan MiniMarket/Usaha Pesantren",
        items: [{ code: "A15", desc: "Penerimaan Usaha Pesantren" }]
      },
      {
        name: "A.1.7. Kafalah Yatim",
        items: [
          { code: "A171", desc: "Penerimaan kafalah dari Yayasan" },
          { code: "A172", desc: "Penerimaan Kafalah dari nonyayasan" }
        ]
      },
      {
        name: "A.1.9. Zakat, Infaq, Shodaqoh",
        items: [{ code: "A19", desc: "ZIS" }]
      }
    ]
  },
  penerimaanTidakRutin: {
    title: "A.2 PENERIMAAN TIDAK RUTIN",
    groups: [
      {
        name: "A.2.1. Sumbangan (Keropak/Pemberian Langsung)",
        items: [{ code: "A21", desc: "Sumbangan (Keropak Masjid / Pemberian Langsung)" }]
      },
      {
        name: "A.2.2. Dana Amanah Pembangunan",
        items: [{ code: "A22", desc: "Dana Amanah Pembangunan" }]
      },
      {
        name: "A.2.3. Uang Tahunan",
        items: [
          { code: "A231", desc: "Wakaf Pengembangan" },
          { code: "A232", desc: "Perlengkapan Asrama" }
        ]
      },
      {
        name: "A233 Perlengkapan Sekolah",
        items: [
          { code: "A2331", desc: "Perlengkapan Sekolah PAUD" },
          { code: "A2332", desc: "Perlengkapan Sekolah MTs dan MA" }
        ]
      },
      {
        name: "A234 Buku dan Ujian",
        items: [
          { code: "A2341", desc: "Buku dan Ujian MI" },
          { code: "A2342", desc: "Buku dan Ujian MTs" },
          { code: "A2343", desc: "Buku dan Ujian MA" },
          { code: "A235", desc: "Kesehatan" },
          { code: "A236", desc: "Bahan Seragam" },
          { code: "A237", desc: "Seragam PAUD" },
          { code: "A238", desc: "Dana Pengembangan Pesantren (DPP)" }
        ]
      },
      {
        name: "A239 Perpustakaan",
        items: [
          { code: "A2391", desc: "Perpustakaan MI" },
          { code: "A2392", desc: "Perpustakaan MTs" },
          { code: "A2393", desc: "Perpustakaan MA" }
        ]
      },
      {
        name: "A240 Kegiatan MTs dan MA",
        items: [
          { code: "A2401", desc: "Kegiatan MTs" },
          { code: "A2402", desc: "Kegiatan MA" },
          { code: "A241", desc: "Kegiatan PAUD" },
          { code: "A242", desc: "Biaya admin VA Sipond" },
          { code: "A243", desc: "Pendaftaran PSB" }
        ]
      },
      {
        name: "A241 Daftar Ulang Kenaikan Kelas",
        items: [{ code: "A241_DU", desc: "Daftar Ulang Kenaikan Kelas" }]
      },
      {
        name: "A.2.4 Dana Titip (Donasi, dll)",
        items: [{ code: "A24", desc: "Dana Titip (Donasi, dll)" }]
      },
      {
        name: "A.2.5 Piutang Guru & Karyawan",
        items: [{ code: "A25", desc: "Piutang Guru & Karyawan" }]
      },
      {
        name: "A.2.6 Penerimaan Lain-lain",
        items: [{ code: "A26", desc: "Penerimaan Lain-lain" }]
      }
    ]
  },
  bebanRutin: {
    title: "B.1 BEBAN RUTIN",
    groups: [
      { name: "B.1.1. Mukafaah", items: [{ code: "B11", desc: "Mukafaah" }] },
      { name: "B.1.2. Sekretariat", items: [{ code: "B12", desc: "Sekretariat" }] },
      { name: "B.1.4. Kesantrian", items: [{ code: "B14", desc: "Kesantrian" }] },
      { name: "B.1.5. Bidang Dakwah Umum dan Sosial", items: [{ code: "B15", desc: "Bidang Dakumsos" }] },
      { name: "B.1.6. Konsumsi", items: [{ code: "B16", desc: "Konsumsi" }] },
      { name: "B.1.7. Bidang Keuangan", items: [{ code: "B17", desc: "Bidang Keuangan" }] },
      { name: "B.1.8. Bidang Rumah Tangga", items: [{ code: "B18", desc: "Bidang Rumah Tangga" }] },
      { name: "B.1.9. Bidang Usaha", items: [{ code: "B19", desc: "Bidang Usaha" }] },
      {
        name: "B.1.10. Bidang Marhalah (PAUD, MI, MTs dan MA)",
        items: [
          { code: "B1101", desc: "PAUD" },
          { code: "B1102", desc: "MI" },
          { code: "B1103", desc: "MTS" },
          { code: "B1104", desc: "MA" }
        ]
      },
      { name: "B.1.11. Bea Tagihan Listrik", items: [{ code: "B111", desc: "Bea Tagihan Listrik" }] },
      { name: "B.1.12. Bea Telepon Dan Internet", items: [{ code: "B112", desc: "Bea Telepon Dan Internet" }] },
      { name: "B.1.13. Bea Operasional Klinik", items: [{ code: "B113", desc: "Bea Operasional Klinik" }] },
      { name: "B.1.15. Uang Muka/Kas Bon Operasional Mahad", items: [{ code: "B115", desc: "Uang Muka/Kas Bon Operasional Mahad (Rutin)" }] },
      { name: "B.1.16. Bea Rutin Lainnya", items: [{ code: "B116", desc: "Bea Rutin Lainnya (Biaya Adm bank dll)" }] },
      { name: "B.1.19. Kesantrian Putri", items: [{ code: "B119", desc: "Kesantrian Putri" }] },
      { name: "B.1.20. Bidang Multimedia", items: [{ code: "B120", desc: "Bidang Multimedia" }] }
    ]
  },
  bebanTidakRutin: {
    title: "B.2 BEBAN TIDAK RUTIN",
    groups: [
      { name: "B.2.1 Pelaksanaan Dana Amanah Pembangunan", items: [{ code: "B21", desc: "Pelaksanaan Dana Amanah Pembangunan" }] },
      { name: "B.2.2 Pelaksanaan Acara", items: [{ code: "B22", desc: "Pelaksanaan Acara" }] },
      { name: "B.2.3 Piutang Guru & Karyawan", items: [{ code: "B23", desc: "Piutang guru & Karyawan" }] },
      { name: "B.2.4. Uang Muka/Kas Bon (Tidak Rutin)", items: [{ code: "B24", desc: "Uang Muka/Kas Bon (Tidak Rutin)" }] },
      { name: "B.2.9 Bea Tidak Rutin Lainnya", items: [{ code: "B29", desc: "Bea Tidak Rutin Lainnya" }] },
      {
        name: "B.3.1 Beban Biaya Tahunan",
        items: [
          { code: "B311", desc: "Biaya pendaftaran" },
          { code: "B312", desc: "Wakaf bangunan" },
          { code: "B313", desc: "Wakaf perlengkapan Asrama" },
          { code: "B314", desc: "Wakaf perlengkapan Sekolah" }
        ]
      },
      {
        name: "B315 Biaya Bahan Seragam & Kelengkapan",
        items: [
          { code: "B151", desc: "Biaya Seragam PAUD" },
          { code: "B152", desc: "Biaya Bahan Seragam MI MTs dan MA" }
        ]
      },
      {
        name: "B316 Biaya Buku dan Ujian",
        items: [
          { code: "B3161", desc: "Biaya buku dan ujian MI" },
          { code: "B3162", desc: "Biaya buku dan ujian MTs" },
          { code: "B3163", desc: "Biaya buku dan ujian MA" }
        ]
      },
      {
        name: "B317 Biaya Kesehatan/Klinik",
        items: [
          { code: "B3171", desc: "Biaya kesehatan Pegawai" },
          { code: "B3172", desc: "Biaya kesehatan Santri" }
        ]
      },
      {
        name: "B318 Biaya Perpustakaan",
        items: [
          { code: "B3181", desc: "Biaya perpustakaan MI" },
          { code: "B3182", desc: "Biaya perpustakaan MTS" },
          { code: "B3183", desc: "Biaya perpustakaan MA" }
        ]
      },
      {
        name: "B319 Biaya Kegiatan MTs dan MA",
        items: [
          { code: "B3191", desc: "Biaya Kegiatan MTS" },
          { code: "B3192", desc: "Biaya Kegiatan MA" }
        ]
      },
      { name: "B320 Biaya Dana Pengembangan Pesantren", items: [{ code: "B320", desc: "Biaya DPP" }] },
      { name: "B33 THT", items: [{ code: "B33", desc: "THT" }] }
    ]
  }
};