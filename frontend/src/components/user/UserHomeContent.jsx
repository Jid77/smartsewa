import React, { useEffect, useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import IndicatorSensor from '../../components/common/IndicatorSensor';
import buttonImage1 from '../../assets/ButtonPembayaran.png';
import buttonImage2 from '../../assets/ButtonPengaduan.png';
import ReportPayment from './ReportPayment';
import axios from 'axios';

function UserHomeContent({ onOpenChat}) {
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [activeUntil, setActiveUntil] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showReportPayment, setShowReportPayment] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const navigate = useNavigate();

  const handleClickLaporPembayaran = () =>{
    if (!userData?.no_room){
      setSnackbar({
            open: true,
            message: 'Anda belum memiliki nomor kamar. Silakan hubungi admin.',
            severity: 'warning',
      });
      return;
    }
    setShowReportPayment(true);
  };

  const handleBackToHome = () => setShowReportPayment(false);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  // Fetch sensor & user data
  useEffect(() => {
  const fetchAll = async () => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser?.no_room || !storedUser?.id) return;

        try {
          // Fetch sensor
          const resSensor = await fetch(`${import.meta.env.VITE_API_URL}/api/monitoring?kamar=${storedUser.no_room}`);
          const dataSensor = await resSensor.json();
          const latest = dataSensor.sensor?.[0];
          setTemperature(latest?.suhu ?? null);
          setHumidity(latest?.kelembapan ?? null);

          // Fetch user info terbaru
          const resUser = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${storedUser.id}`);
          const dataUser = await resUser.json();
          setActiveUntil(dataUser.active_until);
          localStorage.setItem('user', JSON.stringify({ ...storedUser, active_until: dataUser.active_until }));
        } catch (error) {
          console.error('Gagal fetch data:', error);
          setTemperature(null);
          setHumidity(null);
        }
      };

    fetchAll();
    const interval = setInterval(fetchAll, 60000); // Refresh per 1 menit

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUpdatedUser = async () => {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser?.id) return;

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${storedUser.id}`);
        localStorage.setItem('user', JSON.stringify(res.data));
        setUserData(res.data); // <== UPDATE STATE
      } catch (err) {
        console.error('Gagal memperbarui data user:', err);
        if(err?.response?.data?.error === 'User tidak ditemukan'){
          await axios.post(`${import.meta.env.VITE_API_URL}/api/logout`, {}, { withCredentials: true });
          localStorage.removeItem('user');
          navigate('/');
          return;
        }
      }
    };

    fetchUpdatedUser();
  }, []);

  if (!userData) return null;

  return (
    <Box sx={{ height: 'calc(110vh - 200px)', overflow: 'hidden' }}>
      <Box
        sx={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignImtems: 'center', 
          gap: 3,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none', 
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        {console.log('Temperature:', temperature, 'Humidity:', humidity, 'Active Until:', activeUntil)}

        {/* Indikator sensor & Akses listrik */}
        {!showReportPayment && (
          <IndicatorSensor temperature={temperature} humidity={humidity} activeUntil={activeUntil}/>
        )}

        {showReportPayment ? (
          <ReportPayment onClose={handleBackToHome} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box
              component="img"
              src={buttonImage1}
              alt="Lapor Pembayaran"
              sx={{
                width: { xs: '100%', sm: '347px' },
                maxWidth: '347px',
                height: 'auto',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
              onClick={handleClickLaporPembayaran}
            />

            <Box
              component="img"
              src={buttonImage2}
              alt="Chat Admin"
              sx={{
                width: { xs: '100%', sm: '347px' },
                maxWidth: '347px',
                height: 'auto',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
              onClick={onOpenChat}
            />
          </Box>
        )}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </Box>
  );
}

export default UserHomeContent;