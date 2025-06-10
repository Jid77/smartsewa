// src/components/admin/AdminUserPaymentHistoryDetail.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Chip
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import axios from 'axios';

const AdminUserPaymentHistoryDetail = ({ paymentId, onBack }) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchPaymentDetail();
  }, [paymentId]);

  const fetchPaymentDetail = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/laporan-pembayaran/${paymentId}`);
      setPayment(res.data);
    } catch (err) {
      console.error('Gagal ambil detail pembayaran:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !payment) {
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
        height: 'calc(100vh - 130px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Sticky Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          pt: 2,
          pb: 1,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '1px solid #eee',
        }}
      >
        <IconButton size="small" onClick={onBack}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" ml={1}>
          Detail Pembayaran
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, overflowY: 'auto', flex: 1, pb: '30%' }}>
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography fontWeight="bold" variant="h6" mb={1}>
            {payment.User?.username} {payment.User?.no_room ? `(No ${payment.User.no_room})` : ''}
          </Typography>
          <Typography variant="body2">Metode: {payment.jenisPembayaran}</Typography>
          <Typography variant="body2">Jumlah: Rp {Number(payment.jumlah).toLocaleString('id-ID')}</Typography>
          <Typography variant="body2">Periode: {payment.periodePembayaran}</Typography>
          <Typography variant="body2" mb={1}>
            Tanggal: {new Date(payment.tanggalPembayaran).toLocaleString('id-ID')}
          </Typography>
          <Box
            component="img"
            src={`${API_URL}/${payment.buktiBayarUrl.replace(/\\/g, '/')}`}
            alt="Bukti Pembayaran"
            sx={{
              width: '100%',
              maxWidth: 300,
              maxHeight: 500,
              objectFit: 'contain',
              borderRadius: 3,
              mb: 1,
            }}
          />
          <Chip
            label={payment.status}
            color={
              payment.status === 'confirmed'
                ? 'success'
                : payment.status === 'rejected'
                ? 'error'
                : 'warning'
            }
            sx={{ mt: 2, borderRadius: 5, textTransform: 'capitalize' }}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminUserPaymentHistoryDetail;
