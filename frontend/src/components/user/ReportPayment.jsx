import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, MenuItem, Typography,
  IconButton, InputLabel, Select, FormControl,
  FormControlLabel, Checkbox, FormHelperText,
  Snackbar, Alert
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import axios from 'axios';

const metodeList = ["BCA", "Dana", "OVO", "Gopay", "Mandiri"];
const monthOptions = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const RATE_PER_MONTH = 650_000;

const ReportPayment = ({ onClose }) => {
  const [userId, setUserId] = useState(null);
  const [jenisPembayaran, setJenisPembayaran] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [buktiBayar, setBuktiBayar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored?.id) setUserId(stored.id);
  }, []);

  useEffect(() => {
    if (!buktiBayar) return setPreviewUrl('');
    const url = URL.createObjectURL(buktiBayar);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [buktiBayar]);

  const jumlahNumeric = selectedMonths.length * RATE_PER_MONTH;
  const jumlahFormatted = jumlahNumeric.toLocaleString('id-ID');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!jenisPembayaran || !selectedMonths.length || !buktiBayar || !confirmChecked) {
      setSnackbar({ open: true, message: 'Lengkapi semua data & centang konfirmasi!', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('jenisPembayaran', jenisPembayaran);
      formData.append('jumlah', jumlahNumeric);
      formData.append('periodePembayaran', selectedMonths.join(', '));
      formData.append('buktiBayar', buktiBayar);

      await axios.post(`${import.meta.env.VITE_API_URL}/api/lapor-pembayaran`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSnackbar({ open: true, message: 'Laporan terkirim!', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Gagal upload laporan!', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') onClose?.();
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 414,
        height: 'calc(100vh - 120px)', // Sesuaikan sesuai tinggi greeting + bottom nav di global layout kamu
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        mx: 'auto',
        mt: 4.5,
      }}
    >
      {/* Header statis */}
      <Box
        sx={{
          px: 2,
          pt: 2,
          pb: 1,
          borderBottom: '1px solid #eee',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IconButton size="small" onClick={onClose}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" ml={1}>
          Lapor Pembayaran
        </Typography>
      </Box>

      {/* Form scrollable */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          pb: '80px',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: '10px',
            '&:hover': { background: '#555' },
          },
          scrollbarWidth: 'thin',
          scrollbarColor: '#888 transparent',
        }}
      >
        <FormControl fullWidth margin="normal">
          <InputLabel>Metode Pembayaran</InputLabel>
          <Select
            required
            label="Metode Pembayaran"
            value={jenisPembayaran}
            onChange={e => setJenisPembayaran(e.target.value)}
            sx={{ borderRadius: 5 }}
          >
            {metodeList.map(m => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <Autocomplete
            multiple
            options={monthOptions}
            value={selectedMonths}
            onChange={(e, newValue) => setSelectedMonths(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Periode Pembayaran"
                placeholder="Pilih bulan"
                margin="none"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 5,
                  }
                }}
              />
            )}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 5,
              }
            }}
          />
          <FormHelperText sx={{ fontSize: 10}}>Pilih satu atau beberapa bulan</FormHelperText>
        </FormControl>

        <TextField
          fullWidth
          margin="normal"
          label="Jumlah Bayar (Rp)"
          value={`Rp ${jumlahFormatted}`}
          InputProps={{ readOnly: true }}
          sx={{ '& .MuiInputBase-root': { borderRadius: 5 } }}
        />

        <Box mt={2} textAlign="center">
          <input
            id="upload-bayar-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => setBuktiBayar(e.target.files[0])}
          />
          <label htmlFor="upload-bayar-input">
            <Button variant="outlined" component="span" sx={{ borderRadius: 3 }}>
              {buktiBayar ? 'Ganti Bukti Bayar' : 'Upload Bukti Bayar'}
            </Button>
          </label>
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                mt: 2,
                width: '100%',
                maxWidth: 240,
                maxHeight: 600,
                objectFit: 'contain',
                borderRadius: 5,
                boxShadow: 1,
                mx: 'auto'
              }}
            />
          )}
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={confirmChecked}
              onChange={e => setConfirmChecked(e.target.checked)}
                sx={{
                  color: '#5EC38B',
                  '&.Mui-checked': {
                    color: '#5EC38B'
                  }
                }}
            />
          }
          label="Saya yakin data yang saya masukkan sudah benar"
          sx={{ mt: 2 }}
        />

        <Button
          type="submit"
          disabled={!jenisPembayaran || !selectedMonths.length || !buktiBayar || !confirmChecked || loading}
          fullWidth
          variant="contained"
          sx={{ mt: 3, borderRadius: 5,backgroundColor: '#5EC38B',
        '&:hover': {
          backgroundColor: '#4CA977'  
        } }}
        >
          {loading ? 'Mengirim...' : 'Kirim Laporan'}
        </Button>

      </Box>

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={1800}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportPayment;
