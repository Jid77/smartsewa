const db = require('../models'); 
const SensorData = db.SensorData;
const User = db.User; 
const History = db.History;
const { sendEmail } = require('../utils/emailService');
require('dotenv').config();


exports.receiveSensorData = async (req, res) => {
  try {
    const { deviceId, timestamp, sensorData } = req.body;

    if (!deviceId || !timestamp || !Array.isArray(sensorData)) {
      return res.status(400).json({ message: "Data tidak lengkap." });
    }

    const dataToInsert = sensorData.map(item => ({
      deviceId,
      kamar: String(item.kamar),
      suhu: item.suhu,
      kelembapan: item.kelembapan,
      suara: item.suara,
      timestamp
    }));
    console.log("Isi Data", sensorData);

    await SensorData.bulkCreate(dataToInsert);
    console.log("Data sensor berhasil disimpan.");

    // Kirim email jika ada data sensor yang abnormal
    for (const item of sensorData) {
      const kamar = String(item.kamar); 
      const { suhu, kelembapan, suara } = item;

      const isSuhuAbnormal = suhu < 18 || suhu > 30;
      const isKelembapanAbnormal = kelembapan < 30 || kelembapan > 75;
      const isSuaraAbnormal = suara > 2000;
      const isAbnormal = isSuhuAbnormal || isKelembapanAbnormal || isSuaraAbnormal;

      if (isAbnormal) {
        const user = await User.findOne({ where: { no_room: kamar } });

        const issues = [];
        if (isSuhuAbnormal) issues.push(`suhu ${suhu}°C`);
        if (isKelembapanAbnormal) issues.push(`kelembapan ${kelembapan}%`);
        if (isSuaraAbnormal) issues.push(`suara ${suara}`);

        const activityText = `Sensor abnormal di kamar ${kamar} (${issues.join(', ')})`;

        await History.create({
          activity: activityText,  
          userId: user?.id || null,
          laporanId: null
        });
        console.log("Data history berhasil disimpan:", activityText);

         // Konten email
        const subject = `🚨 Sensor Abnormal di Kamar ${kamar}`;
        const emailBody = `
          <p>Halo,</p>
          <p>Terjadi deteksi nilai tidak normal pada sensor di kamar <strong>${kamar}</strong>:</p>
          <ul>
            ${issues.map(i => `<li>${i}</li>`).join('')}
          </ul>
          <p>Mohon segera dilakukan pengecekan.</p>
          <p><i>Smartsewa Monitoring System</i></p>
        `;

        console.log("Mengirim email ke admin dan user:", process.env.EMAIL_USER, user?.email);

        // Kirim email ke admin
        await sendEmail(process.env.EMAIL_USER, subject, emailBody);
        console.log("Email dikirim ke admin.");

        // Kirim email ke user jika ditemukan
        if (user?.email) {
          await sendEmail(user.email, subject, emailBody);
          console.log("Email dikirim ke user:", user.email);
        } else {
          console.log("User tidak ditemukan atau tidak punya email, skip kirim email user.");
        }
      }
    }

    res.status(201).json({ message: "Data sensor berhasil disimpan." });
  } catch (error) {
    console.error("Gagal simpan data sensor:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getMonitoringByRoom = async (req, res) => {
  const kamar = req.query.kamar;

  if (!kamar) return res.status(400).json({ message: "Kamar tidak boleh kosong" });

  try {
    // cari user berdasarkan no_room
    const user = await User.findOne({ where: { no_room: kamar } });

    // ambil data sensor terbaru (misalnya 10 data terakhir)
    const sensor = await SensorData.findAll({
      where: { kamar },
      order: [['timestamp', 'DESC']],
      limit: 10
    });

    res.json({ user, sensor });
  } catch (err) {
    console.error("Gagal ambil monitoring:", err);
    res.status(500).json({ message: "Server error" });
  }
};