const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const db = require('../models');
const { sendEmail } = require('../utils/emailService');
const jwt = require('../utils/jwt');
require('dotenv').config();

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password wajib diisi' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Cek apakah user dengan email tersebut sudah pernah terdaftar (termasuk yang terhapus)
    const existingUser = await db.User.findOne({
      where: { email },
      paranoid: false //  soft deleted
    });

    if (existingUser) {
      if (existingUser.deletedAt) {
        // Restore user lama dan reset datanya
        await existingUser.restore();
        await existingUser.update({
          username,
          password: hashedPassword,
          no_room: null,
          role: 'user'
        });

        //chat room 
        const existingRoom = await db.ChatRoom.findOne({ where: { userId: existingUser.id } });
        if (!existingRoom) {
          await db.ChatRoom.create({ userId: existingUser.id });
        }

        return res.json({
          message: 'Akun berhasil dipulihkan dan diperbarui',
          user: {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            role: existingUser.role,
            no_room: existingUser.no_room,
            createdAt: existingUser.createdAt
          }
        });
      } else {
        return res.status(400).json({ error: 'Email sudah digunakan' });
      }
    }
    const newUser = await db.User.create({
      username, email,
      password: hashedPassword,
      role: 'user',
      no_room: null
    });

    await db.ChatRoom.create({ userId: newUser.id });

    res.json({
      message: 'User berhasil didaftarkan',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        no_room: newUser.no_room,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    console.error('Registrasi error:', err);
    res.status(500).json({ error: 'Registrasi gagal', details: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Kredensial tidak valid' });
    }

    const token = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      no_room: user.no_room,
      createdAt: user.createdAt
    }

    res.cookie('token', jwt.create(token), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // ubah ke true di production (pakai HTTPS)
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000, // 1 hari
    });

    res.json({
      id: user.id, username: user.username,
      email: user.email, role: user.role,
      no_room: user.no_room, createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login gagal', details: err.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // sesuaikan dengan saat login
  });

  res.json({ message: 'Logout berhasil' });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Email tidak ditemukan' });

    const token = crypto.randomBytes(20).toString('hex');
    const expiry = new Date(Date.now() + 3600000);

    await user.update({ reset_token: token, reset_token_expiry: expiry });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const subject = `Reset Password`;
    const emailBody = `
        <p>Hi ${user.username},</p>
        <p>Klik link berikut untuk mereset password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p><i>Link ini akan kadaluarsa dalam 1 jam.</i></p>
        `;
        
    if (user?.email) {
      await sendEmail(user.email, subject, emailBody);
    }


    res.json({ message: 'Link reset password dikirim ke email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Gagal proses reset password' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await db.User.findOne({
      where: {
        reset_token: token,
        reset_token_expiry: { [Op.gt]: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'Token tidak valid atau sudah kedaluwarsa' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null
    });

    res.json({ message: 'Password berhasil direset' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Gagal reset password' });
  }
};
