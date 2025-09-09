"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFormLogin = exports.handleTableAction = exports.addLogbook = exports.getTableData = void 0;
const database_1 = __importDefault(require("../config/database"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Helper function untuk verifikasi token
const verifyAuthToken = (authHeader) => {
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return null;
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (err) {
        return null;
    }
};
// GET /api/table-data - Fetch data untuk Table.js integration
const getTableData = async (req, res) => {
    try {
        console.log('🔄 API /api/table-data called');
        // Ambil user dari token (jika ada)
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        console.log('🔐 Token present:', token ? 'Yes' : 'No');
        let currentUser = null;
        if (token) {
            try {
                currentUser = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                console.log('✅ Token verified for user:', currentUser.username);
            }
            catch (err) {
                console.log('❌ Token verification failed, proceeding without user context');
            }
        }
        // Query dengan JOIN untuk mendapatkan data user berdasarkan foreign key id_pengguna
        const result = await database_1.default.query(`
      SELECT 
        l.*,
        p.username as owner_username,
        p.nama_pengguna as owner_nama_pengguna
      FROM logbook l
      LEFT JOIN pengguna p ON l.id_pengguna = p.id_pengguna
      ORDER BY l.created_at DESC
    `);
        console.log('📊 Raw logbook data:', result.rows);
        // Transform data untuk frontend dan tambahkan permission info
        const transformedData = result.rows.map(row => {
            // Cek permission berdasarkan username yang login vs owner
            const isOwner = currentUser && (currentUser.username === row.owner_username ||
                currentUser.id_pengguna === row.id_pengguna);
            return {
                id: row.id_logbook || row.id,
                date: row.tanggal || row.date,
                nama: row.owner_nama_pengguna || row.nama_pengguna || row.nama,
                judul: row.judul_kegiatan || row.judul_logbook || row.judul,
                keterangan: row.detail_kegiatan || row.keterangan,
                link: row.link_google_docs || row.link,
                // Permission logic: user bisa edit/delete jika dia yang buat logbook
                canEdit: isOwner,
                canDelete: isOwner,
                canView: true,
                owner_username: row.owner_username,
                current_user: currentUser ? currentUser.username : null,
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        });
        console.log('📊 Query result count:', result.rows.length);
        console.log('📤 Sending transformed data:', transformedData.length, 'items');
        if (currentUser) {
            console.log('👤 Current user:', currentUser.username);
            const ownedCount = transformedData.filter(item => item.canEdit).length;
            console.log('📝 User can edit:', ownedCount, 'out of', transformedData.length, 'items');
        }
        res.json({
            success: true,
            data: transformedData,
            currentUser: currentUser,
            totalItems: transformedData.length,
            userCanEdit: currentUser ? transformedData.filter(item => item.canEdit).length : 0
        });
    }
    catch (error) {
        console.error('💥 Error fetching table data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch table data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getTableData = getTableData;
// POST /api/add-logbook - Menambah logbook baru
const addLogbook = async (req, res) => {
    try {
        const { tanggal, judul, keterangan, link } = req.body;
        console.log('📝 Add logbook request:', { tanggal, judul, keterangan, link });
        // Ambil user dari token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required to add logbook'
            });
        }
        let currentUser;
        try {
            currentUser = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            console.log('👤 Adding logbook for user:', currentUser.username);
        }
        catch (err) {
            return res.status(403).json({
                success: false,
                error: 'Invalid token'
            });
        }
        // Validasi input
        if (!tanggal || !judul || !keterangan) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: tanggal, judul, keterangan'
            });
        }
        // Ambil id_pengguna dari database berdasarkan username
        const userResult = await database_1.default.query('SELECT id_pengguna, nama_pengguna FROM pengguna WHERE username = $1', [currentUser.username]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found in database'
            });
        }
        const id_pengguna = userResult.rows[0].id_pengguna;
        // Insert logbook baru menggunakan id_pengguna sebagai foreign key
        const insertResult = await database_1.default.query(`
      INSERT INTO logbook (tanggal, id_pengguna, judul_logbook, keterangan, link, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [tanggal, id_pengguna, judul, keterangan, link || null]);
        const newLogbook = insertResult.rows[0];
        console.log('✅ Logbook added successfully:', newLogbook.id_logbook);
        res.status(201).json({
            success: true,
            message: 'Logbook added successfully',
            data: {
                id: newLogbook.id_logbook,
                date: newLogbook.tanggal,
                nama: userResult.rows[0].nama_pengguna,
                judul: newLogbook.judul_logbook,
                keterangan: newLogbook.keterangan,
                link: newLogbook.link,
                canEdit: true,
                canDelete: true,
                canView: true,
                created_at: newLogbook.created_at,
                updated_at: newLogbook.updated_at
            }
        });
    }
    catch (error) {
        console.error('💥 Error adding logbook:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add logbook',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.addLogbook = addLogbook;
// POST /api/table-action - Handle action dari Table.js (view, edit, delete)
const handleTableAction = async (req, res) => {
    try {
        const { action, id, data } = req.body;
        console.log(`🎯 Table action requested: ${action} for ID: ${id}`);
        // Validasi input
        if (!action || !id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: action and id'
            });
        }
        // Ambil user dari token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }
        let currentUser;
        try {
            currentUser = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            console.log('👤 Action requested by user:', currentUser.username);
        }
        catch (err) {
            return res.status(403).json({
                success: false,
                error: 'Invalid token'
            });
        }
        // Ambil data logbook untuk permission check dengan JOIN ke tabel pengguna
        const logbookResult = await database_1.default.query(`
      SELECT
        l.*,
        p.username as owner_username,
        p.nama_pengguna as owner_nama_pengguna
      FROM logbook l
      LEFT JOIN pengguna p ON l.id_pengguna = p.id_pengguna
      WHERE l.id_logbook = $1
    `, [id]);
        if (logbookResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Logbook not found'
            });
        }
        const logbook = logbookResult.rows[0];
        const isOwner = currentUser.username === logbook.owner_username ||
            currentUser.id_pengguna === logbook.id_pengguna;
        console.log('🔐 Permission check:', {
            currentUser: currentUser.username,
            logbookOwner: logbook.owner_username,
            isOwner: isOwner
        });
        switch (action) {
            case 'view':
                // Semua user bisa view
                console.log('👁️ View action - accessible to all users');
                res.json({
                    success: true,
                    action: 'view',
                    message: `Viewing logbook: ${logbook.judul_kegiatan}`,
                    data: {
                        id: logbook.id_logbook,
                        tanggal: logbook.tanggal,
                        nama_pengguna: logbook.owner_nama_pengguna,
                        judul_logbook: logbook.judul_kegiatan,
                        keterangan: logbook.detail_kegiatan,
                        link: logbook.link_google_docs,
                        created_at: logbook.created_at,
                        updated_at: logbook.updated_at
                    },
                    permissions: {
                        canEdit: isOwner,
                        canDelete: isOwner,
                        canView: true
                    }
                });
                break;
            case 'edit':
                // Hanya owner yang bisa edit
                if (!isOwner) {
                    console.log('❌ Edit denied - user is not owner');
                    return res.status(403).json({
                        success: false,
                        error: 'You can only edit your own logbook entries'
                    });
                }
                // Validasi data untuk edit
                if (!data || !data.judul || !data.keterangan) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing required fields for edit: judul and keterangan'
                    });
                }
                console.log('✏️ Edit action - updating logbook');
                // Update logbook
                const updateResult = await database_1.default.query(`
          UPDATE logbook
          SET tanggal = $1, judul_kegiatan = $2, detail_kegiatan = $3, updated_at = NOW()
          WHERE id_logbook = $4
          RETURNING *
        `, [data.date || logbook.tanggal, data.judul, data.keterangan, id]);
                res.json({
                    success: true,
                    action: 'edit',
                    message: 'Logbook updated successfully',
                    data: updateResult.rows[0]
                });
                break;
            case 'delete':
                // Hanya owner yang bisa delete
                if (!isOwner) {
                    console.log('❌ Delete denied - user is not owner');
                    return res.status(403).json({
                        success: false,
                        error: 'You can only delete your own logbook entries'
                    });
                }
                console.log('🗑️ Delete action - removing logbook');
                await database_1.default.query('DELETE FROM logbook WHERE id_logbook = $1', [id]);
                res.json({
                    success: true,
                    action: 'delete',
                    message: 'Logbook deleted successfully',
                    deletedId: id
                });
                break;
            default:
                res.status(400).json({
                    success: false,
                    error: `Invalid action: ${action}. Allowed actions: view, edit, delete`
                });
        }
    }
    catch (error) {
        console.error('💥 Error handling table action:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to handle table action',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.handleTableAction = handleTableAction;
// POST /login-form - Form submission dari frontend
const handleFormLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Form login attempt:', { username, password: '***' });
        const result = await database_1.default.query('SELECT * FROM pengguna WHERE username = $1', [username]);
        console.log('Database query result:', {
            rowCount: result.rows.length,
            userFound: result.rows.length > 0
        });
        if (result.rows.length === 0) {
            // Return HTML dengan JavaScript untuk redirect dan show error
            return res.send(`
        <html>
          <body>
            <script>
              alert('Username tidak ditemukan');
              window.location.href = 'http://localhost:3000/';
            </script>
          </body>
        </html>
      `);
        }
        const user = result.rows[0];
        console.log('User found:', { id: user.id_pengguna, username: user.username });
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        console.log('Password validation result:', validPassword);
        if (!validPassword) {
            // Return HTML dengan JavaScript untuk redirect dan show error
            return res.send(`
        <html>
          <body>
            <script>
              alert('Password salah');
              window.location.href = 'http://localhost:3000/';
            </script>
          </body>
        </html>
      `);
        }
        const token = jsonwebtoken_1.default.sign({ id_pengguna: user.id_pengguna, username: user.username, nama_pengguna: user.nama_pengguna }, JWT_SECRET, { expiresIn: '24h' });
        // Set token sebagai cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 jam
        });
        // Set user info sebagai cookie
        res.cookie('user', JSON.stringify({
            id_pengguna: user.id_pengguna,
            username: user.username,
            nama_pengguna: user.nama_pengguna
        }), {
            maxAge: 24 * 60 * 60 * 1000 // 24 jam
        });
        console.log('Form login successful, redirecting to Homepage...');
        // Return HTML dengan JavaScript untuk redirect langsung ke homepage
        res.send(`
      <html>
        <body>
          <script>
            localStorage.setItem('token', '${token}');
            localStorage.setItem('user', '${JSON.stringify({
            id_pengguna: user.id_pengguna,
            username: user.username,
            nama_pengguna: user.nama_pengguna
        })}');
            window.location.href = 'http://localhost:3000/Homepage';
          </script>
        </body>
      </html>
    `);
    }
    catch (error) {
        console.error('Form login error:', error);
        res.send(`
      <html>
        <body>
          <script>
            alert('Terjadi kesalahan server');
            window.location.href = 'http://localhost:3000/';
          </script>
        </body>
      </html>
    `);
    }
};
exports.handleFormLogin = handleFormLogin;
