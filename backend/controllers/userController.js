const db = require('../models');
const { Op } = require('sequelize');
const cron = require('node-cron');
const dayjs = require('dayjs');
const { sendEmail } = require('../utils/emailService');
const jwt = require('../utils/jwt');

const saveHistory = async (activity, userId = null, laporanId = null) => {
  try {
    await db.History.create({ activity, userId, laporanId });
  } catch (err) {
    console.error("Gagal simpan history:", err);
  }
};

// 
const checkPowerAccessEmails = async () => {
  try {
    const users = await db.User.findAll({
      where: { active_until: { [db.Sequelize.Op.ne]: null } }
    });

    const now = dayjs();

    for (const user of users) {
      const deadline = dayjs(user.active_until);
      const diff = deadline.diff(now, 'day');

      let subject = '';
      let message = '';
      let activity = '';

      if (diff === 7) {
        subject = '⏳ Akses Listrik Akan Habis dalam 7 Hari';
        message = `Halo ${user.username},<br>Akses listrik kamar Anda akan habis dalam <b>7 hari</b> (${deadline.format('DD MMM YYYY')}).`;
        activity = `Akses listrik akan habis dalam 7 hari (target: ${deadline.format('YYYY-MM-DD')})`;
      } else if (diff === 3) {
        subject = '⏳ Akses Listrik Akan Habis dalam 3 Hari';
        message = `Halo ${user.username},<br>Akses listrik Anda akan habis dalam <b>3 hari</b>.`;
        activity = `Akses listrik akan habis dalam 3 hari (target: ${deadline.format('YYYY-MM-DD')})`;
      } else if (diff === 1) {
        subject = '⚠️ Akses Listrik Akan Habis Besok';
        message = `Halo ${user.username},<br>Akses listrik Anda akan habis <b>besok</b>.`;
        activity = `Akses listrik akan habis besok (target: ${deadline.format('YYYY-MM-DD')})`;
      } else if (now.isAfter(deadline)) {
        subject = '❌ Akses Listrik Telah Habis';
        message = `Halo ${user.username},<br>Akses listrik Anda <b>telah habis</b> sejak ${deadline.format('DD MMM YYYY')}.`;
        activity = `Akses listrik telah habis (target: ${deadline.format('YYYY-MM-DD')})`;
      }

      if (activity) {
        // Cek apakah history sudah ada
        const alreadyLogged = await db.History.findOne({
          where: {
            userId: user.id,
            activity: activity
          }
        });

        if (!alreadyLogged) {
          await db.History.create({ activity, userId: user.id, laporanId: null });
          console.log(`📝 History dicatat: ${activity}`);
        } else {
          console.log(`⚠️ History sudah ada, dilewati: ${activity}`);
        }
      }

      if (subject && message) {
        await sendEmail(user.email, subject, `
          <p>${message}</p>
          <p><i>SmartSewa Monitoring System</i></p>
        `);
        console.log(`📧 Email dikirim ke ${user.email}`);
      }
    }
  } catch (err) {
    console.error("❌ Gagal cek & kirim email & history akses listrik:", err);
  }
};

// Jadwal tes 1menit sekali
// cron.schedule('*/1 * * * *', () => {
//   console.log('⏰ Menjalankan pengecekan akses listrik...');
//   checkPowerAccessEmails();
// });
cron.schedule('0 8 * * *', () => {
  console.log('⏰ Menjalankan pengecekan akses listrik...');
  checkPowerAccessEmails();
})

exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      where: { role: 'user' },
      attributes: ['id', 'username', 'email', 'no_room', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'email', 'role', 'no_room', 'active_until', 'createdAt'],
    });

    if (!user) {      
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // sesuaikan dengan saat login
      });

      return res.status(404).json({ error: 'User tidak ditemukan' })
    };

    res.json(user);
  } catch (err) {
    console.error('Gagal ambil detail user:', err);
    res.status(500).json({ error: 'Gagal mengambil detail user' });
  }
};

exports.updateUserRoom = async (req, res) => {
  const { id } = req.params;
  const { no_room } = req.body;

  try {
    const user = await db.User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    if (no_room) {
      const existing = await db.User.findOne({
        where: { no_room, id: { [Op.ne]: id } },
      });
      if (existing) return res.status(400).json({ error: 'Nomor kamar sudah digunakan' });
    }

    user.no_room = no_room || null;
    await user.save();

    const roomText = no_room ? `diberi nomor kamar ${no_room}` : `dihapus nomor kamarnya`;
    await saveHistory(`${user.username} ${roomText}`, user.id, null);

    res.json({ message: 'No kamar berhasil diperbarui' });
  } catch (err) {
    console.error('Gagal update user:', err);
    res.status(500).json({ error: 'Gagal update nomor kamar' });
  }
};

exports.getUsersWithRoom = async (req, res) => {
  try {
    const users = await db.User.findAll({
      where: { no_room: { [Op.ne]: null } },
      attributes: ['id', 'username', 'no_room', 'active_until'],
      order: [['no_room', 'ASC']]
    });

    res.json(users);
  } catch (err) {
    console.error("Gagal ambil users with room:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    // console.log('Session:', req.session.user);  // 🔍 Debug session
    console.log('Body:', req.body);             // 🔍 Debug body dari frontend
    const isProduction = process.env.NODE_ENV === 'production';

    const currentUser = jwt.verify(req.cookies?.token);
    if (!currentUser) {
      return res.status(401).json({ error: 'Tidak ada sesi pengguna' });
    }

    const { username, email } = req.body;
    const userId = currentUser?.id;

    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Cek jika email sudah digunakan oleh user lain
    const emailExists = await db.User.findOne({
      where: {
        email,
        id: { [db.Sequelize.Op.ne]: userId } // selain user sendiri
      }
    });

    if (emailExists) {
      return res.status(409).json({ error: 'Email sudah digunakan oleh pengguna lain.' });
    }

    // Simpan perubahan
    user.username = username;
    user.email = email;
    await user.save();

    const token = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      no_room: user.no_room,
      createdAt: user.createdAt
    }

    // Update juga session user
    res.cookie('token', jwt.create(token), {
      httpOnly: true,
      secure: isProduction,                      // true jika production
      sameSite: isProduction ? 'none' : 'lax',   // none jika production, lax untuk dev
      maxAge: 24 * 60 * 60 * 1000, // 1 hari
    });

    // Kirim data baru ke frontend, termasuk createdAt agar tidak hilang
    res.json({
      message: 'Profil berhasil diperbarui',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        no_room: user.no_room,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Gagal memperbarui profil', details: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await db.User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    await user.destroy();
    await saveHistory(`User ${user.username} telah dihapus`, user.id, null);

    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error('Gagal hapus user:', err);
    res.status(500).json({ error: 'Gagal menghapus user' });
  }
};
