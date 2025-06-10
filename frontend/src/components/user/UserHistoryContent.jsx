import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import axios from 'axios';

const UserHistoryContent = ({ userId }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/history/user/${userId}`);
      setHistoryData(res.data);
    } catch (err) {
      console.error('Gagal ambil riwayat:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatUserActivity = (activity) => {
    if (activity.includes('dikirim')) return 'Laporan pembayaran telah dikirim';
    if (activity.includes('dikonfirmasi')) return 'Laporan pembayaran telah dikonfirmasi';
    if (activity.includes('ditolak')) {
      const alasan = activity.split('ditolak:')[1]?.trim();
      return alasan
        ? `Laporan pembayaran telah ditolak. Alasan: ${alasan}`
        : 'Laporan pembayaran telah ditolak';
    }
    if (activity.includes('diberi nomor')) return `Anda telah diberi ${activity.split('diberi ')[1]}`;
    if (activity.includes('dihapus nomor')) return 'Nomor kost Anda telah dihapus';
    if (activity.includes('dihapus nomor')) return 'Nomor kost Anda telah dihapus';
    if (activity.includes('sensor abnormal')) {
      const matchSuhu = activity.match(/suhu (\d+(\.\d+)?)C/i);
      const matchKelembapan = activity.match(/kelembapan (\d+(\.\d+)?)%/i);
      const matchSuara = activity.match(/suara/i);

      if (matchSuhu) {
        const suhu = matchSuhu[1];
        return `Terdeteksi suhu abnormal ${suhu}°C di kamarmu`;
      }
      if (matchKelembapan) {
        const kelembapan = matchKelembapan[1];
        return `Tingkat kelembapan tidak normal: ${kelembapan}% di kamarmu`;
      }
      if (matchSuara) {
        return 'Terdeteksi kebisingan tidak wajar di kamarmu';
      }

      return 'Terdeteksi nilai sensor abnormal di kamarmu';
    }
    if (activity.includes('Akses listrik')) {
      if (activity.includes('7 hari')) return 'Akses listrik Anda akan habis dalam 7 hari';
      if (activity.includes('3 hari')) return 'Akses listrik Anda akan habis dalam 3 hari';
      if (activity.includes('besok')) return 'Akses listrik Anda akan habis besok';
      if (activity.includes('telah habis')) return 'Akses listrik Anda telah habis';
      return 'Status akses listrik diperbarui';
    }

    return activity;
  };
  
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 414,
        height: 'calc(100vh - 200px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        mx: 'auto',
        mt: 4.5,
      }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        sx={{
          padding: '8px',
          textAlign: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        Riwayat Aktivitas
      </Typography>

      <Box sx={{ px: 2, pt: 1 }}>
      <FormControl fullWidth size="small" sx={{ mb: 1 }}>
        <InputLabel id="filter-label">Filter</InputLabel>
        <Select
          labelId="filter-label"
          value={filter}
          label="Filter"
          onChange={(e) => setFilter(e.target.value)}
          sx={{
            borderRadius: 2,
            fontSize: 13,
            height: 40,
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 200,
                fontSize: 13,
              },
            },
          }}
        >
          <MenuItem value="semua">Semua</MenuItem>
          <MenuItem value="listrik">Akses Listrik</MenuItem>
          <MenuItem value="pembayaran">Pembayaran</MenuItem>
          <MenuItem value="sensor">Sensor</MenuItem>
        </Select>
      </FormControl>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          paddingBottom: '60%',
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : historyData.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" mt={2}>
            Belum ada riwayat transaksi.
          </Typography>
        ) : (
          <List>
            {historyData
              .filter(item => {
                if (filter === 'semua') return true;
                if (filter === 'listrik') return item.activity.toLowerCase().includes('akses listrik');
                if (filter === 'pembayaran') {
                  return ['dikirim', 'dikonfirmasi', 'ditolak'].some(k => item.activity.includes(k));
                }
                if (filter === 'sensor') {
                  return ['Sensor', 'abnormal'].some(k => item.activity.includes(k));
                }
                return true;
              })
              .map((item, index) => {
              const date = new Date(item.createdAt).toLocaleDateString('id-ID');
              const jumlah = item.LaporanPembayaran?.jumlah
                ? Number(item.LaporanPembayaran.jumlah).toLocaleString('id-ID')
                : null;
              const periode = item.LaporanPembayaran?.periodePembayaran || null;

              const isLaporan =
                ['dikirim', 'dikonfirmasi', 'ditolak'].some((word) =>
                  item.activity.toLowerCase().includes(word)
                );

              return (
                <React.Fragment key={index}>
                  <ListItem disablePadding sx={{ py: 0.3 }}>
                    <ListItemText
                      primary={formatUserActivity(item.activity)}
                      secondary={
                        isLaporan && jumlah && periode
                          ? `${date} • ${periode} • Rp ${jumlah}`
                          : `${date}`
                      }
                      primaryTypographyProps={{ sx: { mb: 0.5 } }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default UserHistoryContent;
