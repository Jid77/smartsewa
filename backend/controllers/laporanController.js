const db = require('../models');
const { Op } = require('sequelize');

const saveHistory = async (activity, userId = null, laporanId = null) => {
  try {
    await db.History.create({ activity, userId, laporanId });
  } catch (err) {
    console.error("Gagal simpan history:", err);
  }
};

exports.laporPembayaran = async (req, res) => {
  const { userId, jenisPembayaran, jumlah, periodePembayaran } = req.body;

  try {
    const laporan = await db.LaporanPembayaran.create({
      userId,
      jenisPembayaran,
      jumlah,
      periodePembayaran,
      tanggalPembayaran: new Date(),
      buktiBayarUrl: req.file.path,
      status: 'pending'
    });
    await saveHistory('Laporan pembayaran telah dikirim', userId, laporan.id);

    res.json({ message: 'Lapor pembayaran berhasil!', data: laporan });
  } catch (err) {
    console.error('Lapor error:', err);
    res.status(500).json({ error: 'Gagal melaporkan pembayaran' });
  }
};

exports.getAllLaporan = async (req, res) => {
  try {
    const laporan = await db.LaporanPembayaran.findAll({
      include: { model: db.User, attributes: ['username', 'email', 'no_room'] },
      order: [['createdAt', 'DESC']]
    });

    res.json(laporan);
  } catch (err) {
    console.error('Gagal ambil laporan:', err);
    res.status(500).json({ error: 'Gagal mengambil laporan' });
  }
};

exports.getLaporanById = async (req, res) => {
  try {
    const laporan = await db.LaporanPembayaran.findByPk(req.params.id, {
      include: { model: db.User, attributes: ['username', 'email', 'no_room'] }
    });

    if (!laporan) return res.status(404).json({ error: 'Laporan tidak ditemukan' });

    res.json(laporan);
  } catch (err) {
    console.error('Gagal ambil detail:', err);
    res.status(500).json({ error: 'Gagal ambil detail laporan' });
  }
};

exports.konfirmasiLaporan = async (req, res) => {
  const { id } = req.params;
  const { status, komentar } = req.body;

  try {
    const laporan = await db.LaporanPembayaran.findByPk(id);
    if (!laporan) return res.status(404).json({ error: 'Laporan tidak ditemukan' });

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    laporan.status = status;
    await laporan.save();

    let activity = '';
    if (status === 'confirmed') {
      activity = 'Laporan pembayaran telah dikonfirmasi';

      const user = await db.User.findByPk(laporan.userId);
      if (user) {
        const periods = laporan.periodePembayaran.split(',').map(p => p.trim());
        const monthsToAdd = periods.length;

        const now = new Date();
        const currentExpiry = user.active_until ? new Date(user.active_until) : now;
        const baseDate = currentExpiry > now ? currentExpiry : now;

        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(baseDate.getMonth() + monthsToAdd);

        user.active_until = newExpiry;
        await user.save();

        await saveHistory(`Masa aktif listrik diperpanjang hingga ${newExpiry.toLocaleDateString('id-ID')}`, user.id, laporan.id);
      }

    } else if (status === 'rejected') {
      activity = `Laporan pembayaran telah ditolak${komentar ? `: ${komentar}` : ''}`;
    }

    await saveHistory(activity, laporan.userId, laporan.id);

    res.json({
      message: `Laporan berhasil di${status === 'confirmed' ? 'konfirmasi' : 'tolak'}`
    });
  } catch (err) {
    console.error('Gagal update laporan:', err);
    res.status(500).json({ error: 'Gagal update laporan' });
  }
};

exports.getPendapatanBulanan = async (req, res) => {
  try {
    const { bulan } = req.query; // Format: "2025-06"
    if (!bulan) return res.status(400).json({ error: 'Parameter bulan wajib diisi' });

    const startDate = new Date(`${bulan}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const laporan = await db.LaporanPembayaran.findAll({
      where: {
        status: 'confirmed',
        tanggalPembayaran: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
      include: {
        model: db.User,
        attributes: ['id', 'username', 'email', 'no_room']
      },
      order: [['tanggalPembayaran', 'ASC']]
    });

    const total = laporan.reduce((sum, lapor) => sum + Number(lapor.jumlah), 0);

    res.json({
      bulan,
      totalPendapatan: total,
      jumlahTransaksi: laporan.length,
      rincian: laporan
        .filter(l => l.User)
        .map(l => ({
        id: l.id,
        jumlah: l.jumlah,
        periode: l.periodePembayaran,
        tanggal: l.tanggalPembayaran,
        user: {
          id: l.User.id,
          username: l.User.username,
          email: l.User.email,
          no_room: l.User.no_room
        }
      }))
    });
  } catch (err) {
    console.error('Gagal ambil pendapatan bulanan:', err);
    res.status(500).json({ error: 'Gagal mengambil data pendapatan' });
  }
};
