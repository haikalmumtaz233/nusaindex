---
title: Non-goal
description: Hal yang sengaja tidak dilakukan NusaIndex, dan alasannya.
---

NusaIndex mengecek apakah data **strukturnya benar**. Ada beberapa hal yang sengaja tidak dilakukan:

- **Tidak mencari pemilik.** NusaIndex tidak akan pernah memberi tahu siapa pemilik NIK, NPWP, plat, atau nomor HP, apalagi alamatnya. Fitur seperti itu mengubah library validasi jadi alat profiling orang.
- **Tidak mengecek ke sistem pemerintah.** Tidak ada panggilan ke Dukcapil, DJP, Samsat, atau operator. Valid bukan berarti nomornya pernah terbit atau masih aktif. Pakai layanan resmi untuk itu.
- **Tidak mengakses jaringan.** Semuanya jalan offline. Dataset diperbarui lewat rilis, bukan diunduh saat runtime.
- **Tidak menebak.** Aturan cuma diambil dari regulasi yang bisa dibaca dan dikutip. Kalau aturan resminya tidak ada (check digit NPWP, struktur NISN, panjang nomor rekening), NusaIndex memilih mengecek lebih sedikit daripada mengarang aturan.
- **Bukan sumber resmi.** NusaIndex tidak berafiliasi dengan Dukcapil, DJP, Komdigi, Polri, Bank Indonesia, atau instansi pemerintah mana pun. Nama dataset merujuk ke regulasinya, tapi dataset ini bukan publikasi resmi.

Data dari [`fake`](/reference/fake/) cuma untuk pengujian dan bisa saja sama dengan nomor milik orang sungguhan.
