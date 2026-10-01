---
title: Non-goal
description: Hal yang tidak akan dilakukan NusaIndex, dan alasannya.
---

NusaIndex mengecek bahwa data **strukturnya benar**. Beberapa hal sengaja tidak dilakukan:

- **Tidak mencari pemilik.** NusaIndex tidak akan pernah memberi tahu siapa pemilik NIK, NPWP, plat, atau nomor HP, atau di mana seseorang tinggal. Itu akan mengubah library validasi menjadi alat untuk memprofilkan orang.
- **Tidak memverifikasi ke sistem pemerintah.** Tidak ada panggilan ke Dukcapil, DJP, Samsat, atau operator. Hasil valid tidak berarti nomor itu pernah diterbitkan atau masih aktif. Gunakan layanan resmi yang berwenang untuk itu.
- **Tidak mengakses jaringan.** Semuanya berjalan offline. Dataset diperbarui lewat rilis, bukan diambil saat runtime.
- **Tidak menebak.** Aturan hanya berasal dari regulasi yang bisa dibaca dan dikutip. Jika tidak ada aturan resmi (check digit NPWP, struktur NISN, panjang nomor rekening), NusaIndex lebih memilih mengecek lebih sedikit daripada mengarang aturan.
- **Bukan sumber resmi.** NusaIndex tidak resmi dan tidak berafiliasi dengan Dukcapil, DJP, Komdigi, Polri, Bank Indonesia, atau instansi pemerintah Indonesia mana pun. Nama dataset merujuk ke regulasi; dataset ini bukan publikasi resmi.

Data uji dari [`fake`](/reference/fake/) hanya untuk pengujian dan bisa bertabrakan dengan nomor sungguhan.
