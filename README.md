# Scorify – Predictive Lead Scoring for Banking Sales
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square&logo=dependabot&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Web_App-blue?style=flat-square&logo=google-chrome&logoColor=white)
![Machine Learning](https://img.shields.io/badge/Machine_Learning-Enabled-orange?style=flat-square&logo=tensorflow&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-Framework-black?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-Library-61DAFB?style=flat-square&logo=react&logoColor=black)

## 📌 Ringkasan Proyek
**Selamat datang di Scorify!**
Scorify adalah aplikasi web yang dirancang untuk membantu tim sales perbankan bekerja lebih efisien dalam menentukan calon nasabah yang memiliki potensi konversi tertinggi. Dengan memanfaatkan model Machine Learning, sistem ini memberikan skor prediksi untuk setiap calon nasabah, sehingga proses prioritas menjadi lebih cepat, terarah, dan berbasis data.

Aplikasi ini menyajikan daftar calon nasabah yang telah diurutkan secara otomatis berdasarkan tingkat prioritas, lengkap dengan fitur panggilan langsung, pencatatan status interaksi, serta integrasi API untuk melakukan prediksi secara realtime. Scorify hadir sebagai solusi praktis bagi tim sales untuk meningkatkan produktivitas, efektivitas penawaran, dan akurasi dalam pengambilan keputusan.

---

## 🛠 Fitur Utama

### 🔹 Dashboard Sales
- Menampilkan daftar nasabah lengkap dengan skor prioritas.
- Sorting otomatis berdasarkan skor tertinggi.
- Filter berdasarkan skor (tinggi, sedang, rendah).

### 🔹 Direct Call System
- Tombol langsung menghubungi nasabah.
- Popup untuk mencatat status panggilan.
- Update status interaksi tersimpan ke sistem.

### 🔹 Tracking Interaksi
- Menandai nasabah sebagai:
  - Sudah/Belum dihubungi
  - Setuju/Tidak setuju penawaran
- Menyimpan histori interaksi untuk pelacakan performa.

### 🔹 Integrasi Machine Learning
- Model menggunakan Logistic Regression & XGBoost.
- Endpoint API untuk prediksi secara realtime.
- Menampilkan warna prioritas (Hijau/Kuning/Merah).

---

## 💻 Cara Penggunaan Aplikasi

1. **Login ke Sistem:** Masuk menggunakan akun Sales atau Admin untuk mengakses dashboard sesuai peran Anda.

2. **Melihat Daftar Nasabah:** Daftar calon nasabah tampil dengan urutan otomatis berdasarkan skor prioritas yang dihasilkan model prediksi.

3. **Cari & Filter Data:** Gunakan fitur pencarian nama, filter skor, atau filter sales (khusus admin) untuk menampilkan data yang dibutuhkan. Data nasabah juga dapat diunduh dalam format CSV.

4. **Buka Detail Nasabah:** Detail berisi skor, nama, alamat, nomor telepon, dan riwayat interaksi yang pernah dilakukan.

5. **Lakukan Interaksi (Sales):** Sales dapat menekan tombol Call untuk menghubungi nasabah dan mencatat hasil interaksi:  Berhasil / Tidak berhasil dan Setuju / Tidak setuju penawaran.

6. **Lihat Laporan:** Halaman laporan menampilkan performa kerja, seperti status penawaran deposito, distribusi skor nasabah. Admin dapat melihat laporan seluruh sales, sedangkan sales melihat laporan pribadinya.

7. **Kelola Akun Sales (Admin):**  Admin dapat menambah, mengedit, dan menghapus akun sales, serta memantau data nasabah per sales.
   
---

## ⚙️ Instalasi & Cara Menjalankan Aplikasi

Sebelum memulai, pastikan Anda sudah memasang:
* Code editor seperti Visual Studio Code
* Web browser seperti Chrome atau Firefox

1. **Download Proyek**
   Anda dapat mengunduh proyek melalui dua cara:
   * Download file ZIP dari GitHub (menu *Code → Download ZIP*)
   * Atau menggunakan git clone dengan URL: `https://github.com/Scorify-Scoring-Financially/Scorify.git`
     
     ```
        git clone https://github.com/Scorify-Scoring-Financially/Scorify.git
     ```

2. **Ekstrak File (Jika Menggunakan ZIP)**
   Jika Anda mengunduh format ZIP, ekstrak folder proyek ke direktori yang diinginkan.

3. **Buka Proyek di Code Editor** Arahkan dan buka folder proyek menggunakan Visual Studio Code atau editor lain.

4. **Buka Terminal** Gunakan terminal terintegrasi di editor (menu *Terminal → New Terminal* atau shortcut *Ctrl + `*).

5. **Install Dependencies** Jalankan perintah `npm install` untuk menginstal seluruh dependensi aplikasi.
   ```
    npm install
   ```

6. **Generate Prisma Client** Jalankan perintah `npx prisma generate` agar Prisma Client dapat digunakan.
   ```
   npx prisma generate
   ```

7. **Jalankan Aplikasi** Gunakan perintah `npm run dev` untuk menjalankan aplikasi dalam mode pengembangan.
  ```
    npm run dev
  ```

8. **Selesai** Aplikasi dapat diakses melalui browser pada alamat: 
```
    http://localhost:3000/
```
   
### 🔐 Akun untuk Pengujian

Gunakan akun berikut untuk mencoba fitur aplikasi:

**Admin**
- **Email:** `admin@scorify.com`
- **Password:** `admin123`

**Sales 1**
- **Email:** `dwikhadafi@scorify.com`
- **Password:** `dafi123`

**Sales 2**
- **Email:** `shafa.af@scorify.com`
- **Password:** `shafa123`
---

## 📁 Setup Environment

Proyek Scorify telah menyediakan file `.env.example` sebagai template konfigurasi environment.
Sebelum menjalankan aplikasi, salin file tersebut menjadi `.env` dan isi variabel-variabel penting sesuai kebutuhan Anda:

```
  cp .env.example .env
```
Pastikan untuk melengkapi nilai variabel berikut:

- `DATABASE_URL` – alamat koneksi database yang digunakan aplikasi  
- `JWT_SECRET` – kunci untuk proses autentikasi JWT  

Apabila Anda menggunakan database atau server berbeda, cukup sesuaikan nilai variabel-variabel tersebut di file `.env` yang telah Anda buat.

---

## 🎬 Dokumentasi Proyek
### Front-End

- Dibangun menggunakan React.js dan Next.js
- Styling menggunakan Tailwind CSS
- Pemanggilan API menggunakan Axios
- Fokus pada UI responsif, mudah digunakan oleh Sales & Admin

### Back-End
- Backend menggunakan Next.js API Routes
- Autentikasi & otorisasi menggunakan middleware
- Mengelola data nasabah dan user (Admin & Sales)
- Terhubung ke database PostgreSQL
- Integrasi penyimpanan data & aset menggunakan GCP

### Machine Learning

- Pengembangan model dilakukan di Google Colab
- Library utama: Scikit-learn, XGBoost, Pandas, NumPy
- Dataset yang digunakan: Bank Marketing Dataset
  
**🔗 Sumber ML:**
- Dataset yang digunakan dapat dilihat di sini → **[Bank Marketing Dataset](https://archive.ics.uci.edu/dataset/222/bank+marketing)**  
- Notebook pengembangan model tersedia pada Google Colab → **[Buka Notebook](https://colab.research.google.com/drive/1r5zFDuOx5J5awtuLxa4hjYeGk3Hgi347?usp=sharing)**  
- File model terlatih dapat diunduh melalui Google Drive → **[Download Model](https://drive.google.com/drive/folders/1DT857d-xcnRz_UuIdplyAPIPrYMk97sf?usp=sharing)**

### 🎥 Demo & Akses Aplikasi
- 🌐 Website: **[Click Here](https://scorify-two.vercel.app/)**
- 💻Penggunaan Produk : **[Click Here](https://youtu.be/nh_6cgU-HC8)**
- 🎥 Video Demo: **[Click Here](https://youtu.be/fUs_xiS34k4?si=jVFrNzo5oN0RsAKF)**

---

## 👥 Tim Pengembang

**ID Tim : A25-CS067**
| Nama                       |ID Anggota   |Learning Path                      | 
| -------------------------- | ------------|-----------------------------------|
| Adinda Rahma Yuni Sumarlin | R891D5X0048 |React & Back End Developer with AI | 
| Alif Jovani Safik          | M891D5Y0162 |Machine Learning |
| Muhammad Dwi Khadafi       | R891D5Y1237 |React & Back End Developer with AI|
| Muhammad Naufal Saputra    | R193D5Y1332 |React & Back End Developer with AI |
| Shafa Aqilah Fahdah        | M299D5X1833 |Machine Learning |
