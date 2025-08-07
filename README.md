# TONATA Logbook Backend

Backend API untuk aplikasi TONATA Logbook dengan struktur MVC yang lengkap.

## 🏗️ Struktur Proyek

```
src/
├── config/           # Konfigurasi database dan JWT
├── controllers/      # Controller untuk handle request/response
├── middleware/       # Middleware untuk auth, validation, error handling
├── models/          # Interface dan tipe data
├── routes/          # Definisi routes API
├── services/        # Business logic dan database operations
└── server.ts        # Entry point aplikasi
```

## 🚀 Fitur

### ✅ Authentication & Authorization
- JWT-based authentication
- Password hashing dengan bcrypt
- Role-based access control
- Token refresh mechanism

### ✅ Logbook Management
- CRUD operations untuk logbook
- Permission-based access (user hanya bisa edit/delete data miliknya)
- Foreign key relationship dengan tabel user
- Search dan filter capabilities

### ✅ User Management
- User registration dan login
- Profile management
- Password validation

### ✅ Security Features
- Input validation
- Error handling
- CORS configuration
- Rate limiting (bisa ditambahkan)

## 📋 API Endpoints

### Authentication
- `POST /api/register` - Register user baru
- `POST /api/login` - Login user

### User Management (memerlukan auth)
- `GET /api/users` - Get semua users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Logbook Management (memerlukan auth)
- `GET /api/logbook` - Get semua logbook dengan permission info
- `GET /api/logbook/:id` - Get logbook by ID
- `POST /api/add-logbook` - Tambah logbook baru
- `PUT /api/logbook/:id` - Update logbook
- `DELETE /api/logbook/:id` - Delete logbook

### Health Check
- `GET /health` - Health check endpoint
- `GET /api/health` - API health check

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v14 atau lebih baru)
- PostgreSQL database
- npm atau yarn

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd backend-tonata-logbook
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
# Buat file .env
cp .env.example .env

# Edit file .env dengan konfigurasi database Anda
DB_USER=postgres
DB_HOST=localhost
DB_NAME=tonata_logbook
DB_PASSWORD=your_password
DB_PORT=5432

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

4. **Setup database**
```sql
-- Buat database
CREATE DATABASE tonata_logbook;

-- Buat tabel pengguna
CREATE TABLE pengguna (
  id_pengguna SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  nama_pengguna VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat tabel logbook dengan foreign key
CREATE TABLE logbook (
  id_logbook SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  id_pengguna INTEGER REFERENCES pengguna(id_pengguna),
  judul_kegiatan VARCHAR(200) NOT NULL,
  detail_kegiatan TEXT NOT NULL,
  link_google_docs TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

5. **Run development server**
```bash
npm run dev
```

## 🔧 Development

### Scripts
- `npm run dev` - Run development server dengan hot reload
- `npm run build` - Build untuk production
- `npm start` - Run production server
- `npm test` - Run tests

### Code Structure

#### Models
Interface dan tipe data untuk:
- `User` - User data structure
- `Logbook` - Logbook data structure
- Request/Response types

#### Services
Business logic untuk:
- Database operations
- Authentication
- Data validation

#### Controllers
Request/Response handling untuk:
- User management
- Logbook management
- Error handling

#### Middleware
- `auth.middleware.ts` - JWT authentication
- `validation.middleware.ts` - Input validation
- `error.middleware.ts` - Error handling

#### Routes
API endpoint definitions untuk:
- User routes
- Logbook routes

## 🔒 Security

### Authentication Flow
1. User login dengan username/password
2. Server validate credentials
3. Generate JWT token dengan user info
4. Client store token di localStorage
5. Client include token di Authorization header untuk request berikutnya

### Permission System
- **View**: Semua user bisa melihat semua logbook
- **Edit/Delete**: User hanya bisa edit/delete logbook miliknya
- **Create**: User yang sudah login bisa membuat logbook baru

### Data Validation
- Input validation untuk semua endpoints
- SQL injection protection dengan parameterized queries
- XSS protection dengan proper data sanitization

## 📊 Database Schema

### Tabel `pengguna`
```sql
CREATE TABLE pengguna (
  id_pengguna SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  nama_pengguna VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabel `logbook`
```sql
CREATE TABLE logbook (
  id_logbook SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  id_pengguna INTEGER REFERENCES pengguna(id_pengguna),
  judul_kegiatan VARCHAR(200) NOT NULL,
  detail_kegiatan TEXT NOT NULL,
  link_google_docs TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Deployment

### Production Setup
1. Set environment variables untuk production
2. Build aplikasi: `npm run build`
3. Start production server: `npm start`
4. Setup reverse proxy (nginx/apache) jika diperlukan
5. Setup SSL certificate untuk HTTPS

### Environment Variables
```bash
NODE_ENV=production
PORT=5001
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=24h
```

## 📝 API Documentation

### Request Format
Semua request harus menggunakan:
- Content-Type: `application/json`
- Authorization: `Bearer <token>` (untuk protected routes)

### Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "Success message"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.
