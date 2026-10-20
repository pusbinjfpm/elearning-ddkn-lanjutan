# Catatan validasi versi 1.0

Pemeriksaan dijalankan pada 19 Oktober 2026 menggunakan Node.js, jsdom, dan simulasi API SCORM 1.2. Tidak ada browser visual atau LMS produksi yang digunakan.

| Pemeriksaan | Hasil |
| --- | --- |
| 32 jalur lengkap: 4 analisis Misi 1 × 4 respons Misi 2 × 2 tindakan Misi 3 | Lolos; hipotesis A/B dipakai bergantian. |
| Seluruh 50 kombinasi intervensi 2–4 dari A–F | Lolos sampai Canvas dan penyelesaian Misi 4. |
| Empat berkas wajib ditandai dibaca | Lolos. |
| Dialog konsekuensi berbeda menurut pilihan | Empat cabang Misi 2 dan dua cabang Misi 3 berbeda; empat cabang Misi 1 dipertahankan. |
| Revisi keputusan dan penyimpanan pilihan pertama | Lolos untuk Misi 1 dan 2; jalur revisi kombinasi/Canvas juga diperiksa. |
| Batas minimum dua dan maksimum empat intervensi | Lolos. |
| Canvas empat kolom dan tinjauan sebelum Tetapkan | Lolos; hubungan koheren dan tidak koheren menghasilkan ulasan berbeda. |
| Refleksi Misi 3 dan refleksi akhir wajib | Tombol lanjut aktif setelah ada isi. |
| Dashboard rute C/B/A + A/B/C/E + Canvas sesuai | Keempat lensa berstatus Kuat; jalur lain dihitung dari kriterianya sendiri. |
| Pembukaan 10 langkah dan penutup 3 dialog | Lolos; completion belum ditetapkan sebelum penutup diselesaikan. |
| Progres v3 ke v4, resume hasil akhir, reset, dan impor tidak valid | Lolos. |
| State ringkas LMS pada setiap titik utama | Roundtrip lolos; data pilihan dan refleksi dipertahankan. |
| Payload dengan kedua refleksi panjang dan tiga jejak revisi penuh | 2.307 byte, di bawah 4.096 byte. |
| HTML job aid dan rekap | Memuat pilihan, Canvas, dashboard, serta refleksi terbaru yang telah diisi. |
| SCORM Initialize → SetValue/Commit → Finish | Lolos pada API simulasi. |
| SCORM incomplete, completed, exit=suspend, waktu sesi dan bookmark | Lolos. |
| Resume dari LMS didahulukan dari progres browser | Lolos. |
| Kegagalan Commit dan pencegahan Finish ganda | Lolos. |
| Manifest akar ZIP, namespace, SCO, launch, referensi semua aset dan integritas ZIP | Lolos. |
| HTML mandiri yang telah dikompilasi | Inisialisasi dan masuk Misi 1 lolos di DOM simulasi. |

Batas verifikasi: tata letak nyata, gerak WebGL, font rendering, unduhan pada browser target, dan komunikasi dengan LMS target perlu diperiksa pada perangkat pelaksanaan. Pengujian DOM tidak membuktikan penampilan visual atau sertifikasi kompatibilitas SCORM.
