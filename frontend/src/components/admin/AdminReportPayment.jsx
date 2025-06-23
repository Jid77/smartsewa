// src/components/admin/AdminReportPayment.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  IconButton
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import axios from 'axios';

const AdminReportPayment = ({ onSelectReport, onBack, onViewIncomeDetail }) => {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchLaporan();
    fetchPendapatan();
  }, []);

  const fetchLaporan = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/laporan-pembayaran`);
      setLaporan(res.data);
    } catch (err) {
      console.error('Gagal ambil laporan:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendapatan = async () => {
    try {
      const today = new Date();
      const bulan = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const res = await axios.get(`${API_URL}/api/laporan-pembayaran/pendapatan?bulan=${bulan}`);
      setSummary(res.data);
    } catch (err) {
      console.error('Gagal ambil pendapatan:', err);
    }
  };
  
  return (
    <Box
      sx={{
        maxWidth: 414,
        mx: 'auto',
        height: '80vh',
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
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <IconButton size="small" onClick={onBack}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" ml={1}>
          Laporan Pembayaran
        </Typography>
      </Box>

{summary && (
  <Box
    sx={{
      pt: 1,
      pb: 2,
      borderBottom: '1px solid #eee',
      mx: '30px', 
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
        <Box>
          <Typography variant="body2" fontWeight="bold" color="text.secondary">
            Total Pendapatan Bulan {new Date(summary.bulan + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </Typography>
          <Typography variant="h6" color="success.main" fontWeight="bold">
            Rp {summary.totalPendapatan.toLocaleString('id-ID')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {summary.jumlahTransaksi} transaksi dikonfirmasi
          </Typography>
        </Box>
          <Box>
            <button
              style={{
                backgroundColor: '#5EC38B',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              onClick={onViewIncomeDetail}
            >
              Lihat Detail
            </button>
          </Box>
        </Box>
      </Box>
    )}


      {/* Scrollable List */}
      {loading ? (
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}> 
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 1,
            paddingBottom: '80%'
          }}
        >
          <List>
            {laporan.filter((item) => item.status === 'pending').map((lapor) => (
              <ListItem
                key={lapor.id}
                button
                onClick={() => onSelectReport(lapor.id)}
                sx={{
                  // borderBottom: '1px solid #eee',
                  alignItems: 'flex-start',
                  py: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    borderBottom: '1px solid #eee',
                    pb: 1.5,
                    mx: '10px', 
                  }}
                >
                <ListItemAvatar>
                  <Avatar
                    alt={lapor.User?.username}
                    src="/default-avatar.png"
                    sx={{ bgcolor: '#5EC38B' }}
                  >
                    {lapor.User?.username?.[0]?.toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography fontWeight="bold">
                      {lapor.User?.username}{' '}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                      {lapor.User?.no_room ? `Kamar ( ${lapor.User.no_room} )` : ''} 
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                      {lapor.jenisPembayaran} — {lapor.periodePembayaran}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(lapor.tanggalPembayaran).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </Typography>
                    </>
                  }
                />
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default AdminReportPayment;
