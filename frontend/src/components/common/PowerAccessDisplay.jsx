import { Box, Typography, LinearProgress } from '@mui/material';
import dayjs from 'dayjs';

export default function PowerAccessDisplay({ activeUntil }) {
  const maxHari = 30;

  if (!activeUntil) {
    return (
      <Box sx={{ position: 'relative', mt: 2, mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={1} mx={1}>
          Akses Listrik
        </Typography>
        <Typography variant="body2" mx={1} color="text.secondary">
          Belum ada akses listrik
        </Typography>
      </Box>
    );
  }

  const now = dayjs();
  const until = dayjs(activeUntil);
  const durasi = until.diff(now, 'minute'); // total selisih dalam menit

  const sisaHari = Math.floor(durasi / 1440); // 1 hari = 1440 menit
  const sisaJam = Math.floor((durasi % 1440) / 60);
  const persen = ((sisaHari + sisaJam / 24) / maxHari) * 100;

  return (
    <Box sx={{ position: 'relative', mt: 2, mb: 4 }}>
      <Typography variant="h6" fontWeight="bold" mb={1} mx={1}>
        Akses Listrik
      </Typography>

      <Box sx={{ position: 'relative' }}>
        <LinearProgress
          variant="determinate"
          value={persen}
          sx={{
            height: 18,
            borderRadius: 10,
            backgroundColor: '#eee',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#FFD700',
              borderRadius: 10,
            },
          }}
        />
        <Typography
          variant="body2"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#000',
          }}
        >
          {sisaHari} Hari {sisaJam} Jam
        </Typography>
      </Box>
    </Box>
  );
}
