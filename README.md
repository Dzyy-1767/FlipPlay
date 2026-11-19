# FlipPlay

FlipPlay adalah prototipe katalog hiburan dengan antarmuka responsif untuk menjelajahi anime. Pengguna dapat mencari judul, memfilter katalog berdasarkan genre atau jumlah episode, dan membuka halaman detail dari sumber data.

> FlipPlay saat ini merupakan katalog/demo front-end, bukan layanan untuk memutar video atau membaca manga/light novel.

## Fitur

- Halaman beranda responsif dengan navigasi desktop dan mobile.
- Katalog anime dengan pencarian judul.
- Filter berdasarkan kategori suasana dan jumlah episode.
- Data katalog dari TVMaze, dengan Jikan sebagai sumber cadangan.
- Tampilan skeleton saat memuat, pesan saat data gagal dimuat, dan tombol untuk mencoba lagi.
- Animasi yang menghormati preferensi `prefers-reduced-motion`.

## Teknologi

- HTML, JavaScript, dan CSS
- [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TVMaze API](https://www.tvmaze.com/api) dan [Jikan API](https://jikan.moe/)

## Menjalankan secara lokal

Persyaratan: Node.js yang kompatibel dengan versi Vite di `package.json` dan npm.

```bash
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan Vite di terminal (biasanya `http://localhost:5173`).

## Perintah

```bash
npm run dev      # Menjalankan server pengembangan
npm run build    # Membuat build produksi ke folder dist/
npm run preview  # Meninjau build produksi secara lokal
npm run format   # Memformat file dengan oxfmt
```

## Struktur proyek

```text
.
├── index.html
├── src/
│   ├── index.css
│   ├── main.js
│   └── vite-env.d.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

## Catatan data

Katalog membutuhkan koneksi internet untuk mengambil data dari API publik. TVMaze digunakan sebagai sumber utama, sedangkan Jikan digunakan ketika permintaan utama gagal. Hasil dan ketersediaan data bergantung pada layanan API tersebut.
