// src/components/admin/AdminHomeContent.jsx
import React from 'react';
import { Box } from '@mui/material';
import buttonImage1 from '../../assets/ButtonLaporanPembayaran.png';
import buttonImage2 from '../../assets/ButtonLaporanPenghuni.png';
import buttonImage3 from '../../assets/ButtonDataPenghuni.png';
import buttonImage4 from '../../assets/ButtonMonitoringSensor.png';

function HomeContent({ onOpenLaporan, onOpenDataPenghuni, onOpenMonitoring, onOpenChatRoom }) {
  // Fungsi untuk menangani klik pada tombol laporan pembayaran 
  return (
    <Box
      sx={{
        height: 'calc(110vh - 200px)',
        overflowY: 'auto', // ✅ biarkan scroll secara vertikal
        position: 'relative',
        zIndex: 1,
        px: 2, 
        pt: 2,
        // pb: 1, 
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          marginTop: '55px',
        }}
      >
        <Box
          component="img"
          src={buttonImage1}
          alt="Laporan Pembayaran"
          sx={buttonStyle}
          onClick={onOpenLaporan}
        />
        <Box
          component="img"
          src={buttonImage2}
          alt="Laporan Penghuni"
          sx={buttonStyle}
          onClick={() => onOpenChatRoom()}
        />
        <Box
          component="img"
          src={buttonImage3}
          alt="Data Penghuni"
          sx={buttonStyle}
          onClick={() => onOpenDataPenghuni()} 
        />
        <Box
          component="img"
          src={buttonImage4}
          alt="Data Penghuni"
          sx={buttonStyle}
          onClick={() => onOpenMonitoring()} 
        />
        
      </Box>

    </Box>
  );
}

const buttonStyle = {
  width: { xs: '100%', sm: '347px' },
  maxWidth: '347px',
  height: 'auto',
  borderRadius: '20px',
  cursor: 'pointer',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
};

export default HomeContent;
