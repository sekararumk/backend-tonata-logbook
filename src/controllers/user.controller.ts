import { Request, Response } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  authenticateUser
} from '../services/user.service';
import { CreateUserRequest, UpdateUserRequest, LoginRequest } from '../models/user.model';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const userData: CreateUserRequest = req.body;
    
    // Validasi data yang diperlukan
    if (!userData.username || !userData.nama_pengguna || !userData.password) {
      return res.status(400).json({ 
        error: 'Missing required fields: username, nama_pengguna, password' 
      });
    }

    // Validasi panjang password minimal
    if (userData.password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    const newUser = await createUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const loginData: LoginRequest = req.body;
    
    // Validasi data yang diperlukan
    if (!loginData.username || !loginData.password) {
      return res.status(400).json({ 
        error: 'Missing required fields: username, password' 
      });
    }

    const authResult = await authenticateUser(loginData);
    if (!authResult) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    res.json({
      success: true,
      ...authResult
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Cek apakah user yang login sama dengan user yang akan diupdate
    if (currentUser.id_pengguna !== id) {
      return res.status(403).json({ error: 'Access denied. You can only update your own profile.' });
    }

    const updateData: UpdateUserRequest = req.body;
    
    // Validasi bahwa setidaknya ada satu field yang diupdate
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Validasi panjang password minimal jika password diupdate
    if (updateData.password && updateData.password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    const updatedUser = await updateUser(id, updateData);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Cek apakah user yang login sama dengan user yang akan dihapus
    if (currentUser.id_pengguna !== id) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own account.' });
    }

    const deleted = await deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
