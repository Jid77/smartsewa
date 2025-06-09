const db = require('../models');
const pusher = require('../config/pusher');
const jwt = require('../utils/jwt');

// Kirim pesan
exports.sendMessage = async (req, res) => {
  try {
    const { roomId, message } = req.body;

    // Ambil user dari session
    const currentUser = jwt.verify(req.cookies?.token);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sender = currentUser.role; // 'user' atau 'admin'

    // Simpan ke database
    const newMsg = await db.ChatMessage.create({
      roomId,
      sender,
      message,
    });

    // Kirim via Pusher
    pusher.trigger(`chat-room-${roomId}`, 'new-message', {
      sender,
      message,
      timestamp: newMsg.timestamp,
    });

    res.status(201).json(newMsg);
  } catch (err) {
    console.error('Gagal kirim pesan:', err);
    res.status(500).json({ error: 'Gagal kirim pesan' });
  }
};
// Ambil semua room + info user (khusus admin)
exports.getAllChatRooms = async (req, res) => {
  try {
    // const currentUser = jwt.verify(req.cookies?.token);
    
    // if (!currentUser || currentUser.role !== 'admin') {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    const rooms = await db.ChatRoom.findAll({
      include: {
        model: db.User,
        attributes: ['id', 'username', 'email', 'no_room'],
        required: true
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(rooms);
  } catch (err) {
    console.error('Gagal ambil daftar room:', err);
    res.status(500).json({ error: 'Gagal mengambil data room' });
  }
};

// Ambil atau buat room milik user
exports.getMyRoom = async (req, res) => {
  try {
    const currentUser = jwt.verify(req.cookies?.token);
    if (!currentUser || currentUser.role !== 'user') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let room = await db.ChatRoom.findOne({ where: { userId: currentUser.id } });

    if (!room) {
      room = await db.ChatRoom.create({ userId: currentUser.id });
    }

    res.json({ roomId: room.id });
  } catch (err) {
    console.error('Gagal ambil room:', err);
    res.status(500).json({ error: 'Gagal mengambil data room' });
  }
};

// Ambil semua pesan dalam satu room
exports.getMessagesByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUser = jwt.verify(req.cookies?.token);

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const room = await db.ChatRoom.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room tidak ditemukan' });
    }

    // Batasi akses user hanya ke room miliknya
    if (currentUser.role === 'user' && room.userId !== currentUser.id) {
      return res.status(403).json({ error: 'Akses ditolak ke room ini' });
    }

    const messages = await db.ChatMessage.findAll({
      where: { roomId },
      order: [['timestamp', 'ASC']],
    });

    res.json(messages);
  } catch (err) {
    console.error('Gagal ambil pesan:', err);
    res.status(500).json({ error: 'Gagal mengambil pesan' });
  }
};
