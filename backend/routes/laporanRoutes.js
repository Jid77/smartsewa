const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');
const multer = require('multer');
const path = require('path');

// === Setup Multer ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/lapor-pembayaran', upload.single('buktiBayar'), laporanController.laporPembayaran);
router.get('/laporan-pembayaran', laporanController.getAllLaporan);
router.get('/laporan-pembayaran/pendapatan', laporanController.getPendapatanBulanan);
router.get('/laporan-pembayaran/:id', laporanController.getLaporanById);
router.post('/konfirmasi-laporan/:id', laporanController.konfirmasiLaporan);

module.exports = router;
