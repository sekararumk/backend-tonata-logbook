# Backend Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:
```
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_USER=postgre
DB_HOST=localhost
DB_NAME=tonata_logbook
DB_PASSWORD=pgadmin4
DB_PORT=5432
```

## Database Setup

1. Make sure PostgreSQL is running
2. Create database `tonata_logbook` if it doesn't exist:
```sql
CREATE DATABASE tonata_logbook;
```

3. The server will automatically create the `users` table when it starts

## Running the Server

```bash
npm run server
```

The server will start on port 5000 (or the port specified in your .env file).

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status

### Register User
- **POST** `/api/register`
- Body: `{ "username": "string", "password": "string", "email": "string" }`

### Login
- **POST** `/api/login`
- Body: `{ "username": "string", "password": "string" }`
- Returns JWT token

### Get Profile (Protected)
- **GET** `/api/profile`
- Headers: `Authorization: Bearer <token>`

### Get All Users
- **GET** `/api/users`
- Returns list of all users

## Testing the API

You can test the endpoints using tools like Postman or curl:

### Register a new user:
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123", "email": "test@example.com"}'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS enabled for frontend integration
- Input validation
- SQL injection protection with parameterized queries

## Database Schema

The `users` table has the following structure:
- `id`: Serial primary key
- `username`: Unique username (VARCHAR 50)
- `password`: Hashed password (VARCHAR 255)
- `email`: Optional email (VARCHAR 100)
- `created_at`: Timestamp of account creation 