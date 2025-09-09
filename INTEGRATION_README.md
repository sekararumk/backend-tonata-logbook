# 🔗 Table.js Integration dengan Backend

## 📋 Overview

Backend ini telah dikonfigurasi untuk mengintegrasikan frontend Table.js dengan database PostgreSQL tanpa mengubah file frontend apapun. Integrasi menggunakan script JavaScript yang di-inject ke halaman untuk mengganti data dummy dengan data real dari database.

## 🎯 Fitur Utama

### ✅ Permission Control
- **View**: Semua user bisa melihat detail logbook
- **Edit**: Hanya pemilik logbook yang bisa mengedit
- **Delete**: Hanya pemilik logbook yang bisa menghapus

### ✅ Authentication
- Menggunakan JWT token yang disimpan di localStorage
- Token dikirim via Authorization header
- Fallback mode untuk user yang belum login (hanya bisa view)

### ✅ Real-time Integration
- Data diambil langsung dari database PostgreSQL
- Auto-refresh setelah edit/delete
- Notifikasi real-time untuk feedback user

## 🚀 Cara Penggunaan

### 1. Jalankan Backend
```bash
cd backend-tonata-logbook
npm install
npm start
```
Backend akan berjalan di `http://localhost:5001`

### 2. Jalankan Frontend
```bash
# Di root directory project
npm start
```
Frontend akan berjalan di `http://localhost:3000`

### 3. Integrasikan Script
Ada beberapa cara untuk mengintegrasikan script:

#### Opsi A: Inject via Browser Console (untuk testing)
1. Buka halaman Table.js di browser (`http://localhost:3000/Homepage`)
2. Buka Developer Tools (F12)
3. Jalankan di console:
```javascript
const script = document.createElement('script');
script.src = 'http://localhost:5001/integration/table-integration.js';
document.head.appendChild(script);
```

#### Opsi B: Tambahkan ke HTML (permanent)
Tambahkan script tag ke file HTML yang memuat Table.js:
```html
<script src="http://localhost:5001/integration/table-integration.js"></script>
```

## 🔧 API Endpoints

### GET `/api/table-data`
Mengambil semua data logbook dengan informasi permission
- **Headers**: `Authorization: Bearer <token>` (optional)
- **Response**: 
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2025-01-06",
      "nama": "John Doe",
      "judul": "Meeting Project",
      "keterangan": "Diskusi progress project",
      "canEdit": true,
      "canDelete": true,
      "canView": true
    }
  ],
  "currentUser": { "username": "john", "id_pengguna": 1 },
  "totalItems": 1,
  "userCanEdit": 1
}
```

### POST `/api/table-action`
Handle aksi view, edit, delete
- **Headers**: `Authorization: Bearer <token>` (required untuk edit/delete)
- **Body**:
```json
{
  "action": "view|edit|delete",
  "id": 1,
  "data": { "judul": "New Title", "keterangan": "New Description" }
}
```

### POST `/api/add-logbook`
Menambah logbook baru
- **Headers**: `Authorization: Bearer <token>` (required)
- **Body**:
```json
{
  "tanggal": "2025-01-06",
  "judul": "New Logbook",
  "keterangan": "Description",
  "link": "https://docs.google.com/..." // optional
}
```

## 🧪 Testing & Debugging

### Browser Console Commands
Setelah script di-load, gunakan commands berikut di browser console:

```javascript
// Cek status user yang login
window.tableIntegration.getCurrentUser();

// Cek token
window.tableIntegration.getToken();

// Test fetch data
window.tableIntegration.fetchData();

// Test action
window.tableIntegration.handleAction('view', 1);

// Re-initialize integrasi
window.tableIntegration.reinitialize();
```

### Debug Endpoints
- `GET /debug/test-db` - Test koneksi database dan lihat data
- `GET /debug/logbook-data` - Lihat raw data logbook
- `GET /table-integration-script` - Dokumentasi dan instruksi

## 📊 Database Schema

### Tabel `logbook`
```sql
- id_logbook (integer, primary key)
- tanggal (date)
- nama_pengguna (varchar)
- judul_kegiatan (varchar)
- detail_kegiatan (text)
- link_google_docs (varchar, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabel `pengguna`
```sql
- id_pengguna (integer, primary key)
- username (varchar, unique)
- nama_pengguna (varchar)
- password (varchar, hashed)
```

## 🔒 Security

### Authentication Flow
1. User login via frontend form
2. Backend verifikasi credentials dan generate JWT token
3. Token disimpan di localStorage
4. Setiap request ke API menyertakan token di Authorization header
5. Backend verifikasi token dan set user context

### Permission Logic
```javascript
// User bisa edit/delete jika:
const isOwner = currentUser.username === logbook.owner_username || 
               currentUser.nama_pengguna === logbook.nama_pengguna;
```

## 🚨 Troubleshooting

### Script tidak ter-load
- Pastikan backend berjalan di port 5001
- Cek CORS settings di browser console
- Pastikan path script benar: `/integration/table-integration.js`

### Data tidak muncul
- Cek koneksi database di `/debug/test-db`
- Pastikan tabel logbook ada dan berisi data
- Cek browser console untuk error messages

### Permission tidak bekerja
- Pastikan user sudah login dan token valid
- Cek mapping username antara tabel pengguna dan logbook
- Verifikasi di browser console: `window.tableIntegration.getCurrentUser()`

### Edit/Delete tidak berfungsi
- Pastikan token valid dan user adalah pemilik logbook
- Cek response di Network tab browser
- Verifikasi permission di response `/api/table-data`

## 📝 Notes

- **Tidak ada perubahan pada file frontend** - semua integrasi dilakukan via script injection
- **Backward compatible** - jika script tidak ter-load, Table.js tetap berfungsi dengan data dummy
- **Real-time updates** - setiap perubahan langsung ter-reflect di database
- **Responsive design** - button permissions disesuaikan dengan status user

## 🔄 Development Workflow

1. **Backend Development**: Edit files di `backend-tonata-logbook/src/`
2. **Script Integration**: Edit `backend-tonata-logbook/public/table-integration.js`
3. **Testing**: Gunakan browser console dan debug endpoints
4. **Production**: Deploy backend dan pastikan script accessible via CDN/static files

---

**🎉 Integrasi siap digunakan! Frontend Table.js sekarang terhubung dengan database PostgreSQL dengan full permission control.**
