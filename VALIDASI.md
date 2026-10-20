# Catatan validasi versi 1.1.1

Pemeriksaan dijalankan pada 20 Oktober 2026 menggunakan Node.js, jsdom, dan simulasi API SCORM 1.2. Tidak ada browser visual atau LMS produksi yang digunakan.

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
| Payload dengan kedua refleksi panjang dan tiga jejak revisi penuh | 2.323 byte, di bawah 4.096 byte. |
| HTML job aid dan rekap | Memuat pilihan, Canvas, dashboard, serta refleksi terbaru yang telah diisi. |
| SCORM Initialize → SetValue/Commit → Finish | Lolos pada API simulasi. |
| SCORM incomplete, completed, exit=suspend, waktu sesi dan bookmark | Lolos. |
| Resume dari LMS didahulukan dari progres browser | Lolos. |
| Kegagalan Commit dan pencegahan Finish ganda | Lolos. |
| Manifest akar ZIP, namespace, SCO, launch, referensi semua aset dan integritas ZIP | Lolos. |
| HTML mandiri yang telah dikompilasi | Inisialisasi dan masuk Misi 1 lolos di DOM simulasi. |

Batas verifikasi: tata letak nyata, gerak WebGL, font rendering, unduhan pada browser target, dan komunikasi dengan LMS target perlu diperiksa pada perangkat pelaksanaan. Pengujian DOM tidak membuktikan penampilan visual atau sertifikasi kompatibilitas SCORM.


## Audio

| Pemeriksaan | Hasil |
| --- | --- |
| 7 MP3 dan 6 WAV | Seluruh berkas berhasil didecode ffmpeg, tidak kosong, tidak mengandung nilai non-finite, tanpa clipping digital; puncak maksimum 0,42. |
| Aktivasi audio | AudioContext tidak dibuat sebelum tindakan Mulai/Lanjutkan. |
| Tema menurut bagian cerita | Seluruh tujuh tema dan pemetaan scene diperiksa. |
| Perpindahan panel dalam tema sama | Sumber musik tetap; tidak dimulai ulang. |
| Transisi tema | Sumber baru masuk perlahan; sumber lama diberhentikan setelah fade. |
| Hasil decode yang terlambat | Tidak mengganti musik scene terbaru. |
| Ketikan | Mengikuti teks; Tampilkan semua, Instan, dialog, dan tab tersembunyi menghentikan bunyi. |
| Volume dan sakelar | Musik dan ketikan dapat dikendalikan terpisah. |
| Dialog dan tab | Musik mengecil saat dialog; AudioContext dijeda saat tab tersembunyi dan dilanjutkan kembali. |
| Progres audio | Pengaturan bertahan melalui JSON dan compact state LMS; progres v1.0 mendapat default audio. |
| Browser tanpa Web Audio | Tetap dapat menjalankan cerita; status pengaturan menjelaskan audio tidak tersedia. |

Pemeriksaan audio memakai simulasi Web Audio API dan DOM serta analisis berkas hasil decode. Pengujian ini belum mencakup mendengarkan bunyi di browser atau speaker sesungguhnya, kualitas musikal subjektif, dan perilaku autoplay pada browser/LMS tujuan.


## Pemeriksaan revisi ketikan 1.1.1

- Simulasi audio dan DOM kembali lolos: aktivasi, transisi musik, ketikan, volume terpisah, jeda dialog/tab, simpan/muat pengaturan, serta kompatibilitas progres lama.
- Simulasi 3 detik menghasilkan 21 ketukan; semua jarak minimal 115 ms dan tidak ada sampel sama berturut-turut.
- Akhir kalimat memberi jeda minimal 240 ms; menampilkan semua teks tetap menghentikan suara.
- Keenam WAV terbaca tanpa clipping, RMS sekitar 0,020; energi di atas 3 kHz kurang dari 0,02% setiap sampel.
- Ketujuh berkas musik latar dibandingkan dengan versi 1.1 dan identik secara byte.
- Kode cerita, kecepatan teks, state, SCORM, dan animasi identik dengan versi 1.1. Pemeriksaan seluruh cabang sebelumnya tidak diulang karena perubahan dibatasi pada audio ketikan.
- Pemutaran langsung di browser belum diuji pada revisi ini.
