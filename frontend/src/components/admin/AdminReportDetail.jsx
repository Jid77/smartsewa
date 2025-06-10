import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper,
  CircularProgress, Chip, Snackbar, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import axios from 'axios';

const AdminReportDetail = ({ reportId, onBack }) => {
  const [lapor, setLapor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchDetail();
  }, [reportId]);

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/laporan-pembayaran/${reportId}`);
      setLapor(res.data);
    } catch (err) {
      console.error('Gagal ambil detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKonfirmasi = async (status, reason = null) => {
    try {
      setConfirming(true);
      await axios.post(`${API_URL}/api/konfirmasi-laporan/${reportId}`, {
        status,
        komentar: reason,
      });
      setSnackbar({
        open: true,
        message: `Laporan ${status === 'confirmed' ? 'dikonfirmasi' : 'ditolak'}`,
        severity: 'success'
      });
      setTimeout(() => onBack(), 1000);
    } catch (err) {
      setSnackbar({ open: true, message: 'Gagal mengupdate status', severity: 'error' });
    } finally {
      setConfirming(false);
    }
  };
  

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  if (loading || !lapor) {
    return (
      <Box sx={{ pt: '130px', textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 414,
        mx: 'auto',
        height: 'calc(100vh - 130px)', // sesuai greeting + bottom nav
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Sticky Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          px: 2,
          pt: 2,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
        }}
      >
        <IconButton size="small" onClick={onBack}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" ml={1}>
          Detail Laporan
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          paddingBottom: '30%',
       }}
      >
        <Paper sx={{ p: 2, borderRadius: 3, mt: 2 }}>
          <Typography fontWeight="bold" variant="h6" mb={1}>
            {lapor.User?.username} {lapor.User?.no_room ? `(No ${lapor.User.no_room})` : ''}
          </Typography>
          <Typography variant="body2">Metode: {lapor.jenisPembayaran}</Typography>
          <Typography variant="body2">
            Jumlah: Rp {Number(lapor.jumlah).toLocaleString('id-ID')}
          </Typography>
          <Typography variant="body2">Periode: {lapor.periodePembayaran}</Typography>
          <Typography variant="body2" mb={1}>
            Tanggal: {new Date(lapor.tanggalPembayaran).toLocaleString('id-ID')}
          </Typography>
          <Box
            component="img"
            src={`${API_URL}/${lapor.buktiBayarUrl.replace(/\\/g, '/')}`}
            alt="Bukti Bayar"
            sx={{
              width: '100%',
              maxWidth: 300,
              maxHeight: 500,
              objectFit: 'contain',
              borderRadius: 3,
              mb: 1
            }}
          />
          <Chip
            label={lapor.status}
            color={lapor.status === 'confirmed' ? 'success' : lapor.status === 'rejected' ? 'error' : 'warning'}
            sx={{ mb: 2, borderRadius: 5, textTransform: 'capitalize' }}
          />

          {lapor.status === 'pending' && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                disabled={confirming}
                onClick={() => handleKonfirmasi('confirmed')}
                sx={{
                  borderRadius: 5,
                  bgcolor: '#5EC38B',
                  color: '#fff',
                  '&:hover': { bgcolor: '#51B57D' }
                }}
              >
                {confirming ? 'Mengonfirmasi...' : 'Konfirmasi'}
              </Button>
              <Button
                fullWidth
                color="error"
                disabled={confirming}
                onClick={() => setOpenDialog(true)}
                sx={{
                  borderRadius: 5,
                  bgcolor: '#FF4D4D',
                  color: '#fff',
                  '&:hover': { bgcolor: '#FF1A1A' }
                }}
              >
                {confirming ? 'Menolak...' : 'Tolak'}
              </Button>
              <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth 
              PaperProps={{
                sx: { borderRadius: 4 }
              }}>
              <DialogTitle>Alasan Penolakan</DialogTitle>
              <DialogContent>
                <TextField
                  select
                  label="Pilih alasan"
                  fullWidth
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  sx={{ mb: 2, mt: 1 }}
                  InputProps={{
                    sx: { borderRadius: 3 }
                  }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: { borderRadius: 4 }
                      }
                    }
                  }}
                >
                  <MenuItem value="">-- Pilih alasan --</MenuItem>
                  <MenuItem value="Bukti pembayaran tidak jelas">Bukti pembayaran tidak jelas</MenuItem>
                  <MenuItem value="Jumlah tidak sesuai">Jumlah tidak sesuai</MenuItem>
                  <MenuItem value="Periode salah">Periode salah</MenuItem>
                </TextField>
                <TextField
                  label="Atau tulis alasan sendiri"
                  fullWidth
                  multiline
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: 3 }
                  }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: { borderRadius: 4 }
                      }
                    }
                  }}
                />
              </DialogContent>
              <DialogActions>
                <Button sx={{ borderRadius: 4, color: 'black', '&:hover': { color: 'black' } }} onClick={() => setOpenDialog(false)}>Batal</Button>
                <Button
                  variant="contained"
                  color="error"
                  sx={{ borderRadius: 4, bgcolor: '#FF4D4D', color: '#fff', '&:hover': { bgcolor: '#FF1A1A' } }}
                  onClick={() => {
                    const alasan = customReason || selectedReason || 'Tidak ada alasan diberikan';
                    handleKonfirmasi('rejected', alasan);
                    setOpenDialog(false);
                  }}
                >
                  Tolak
                </Button>
              </DialogActions>
            </Dialog>

            </Box>
            
          )}
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminReportDetail;
