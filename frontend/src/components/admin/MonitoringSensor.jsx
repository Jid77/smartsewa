import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  Paper,
  Container,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import SensorChart from '../common/SensorChart';
import PowerAccessDisplay from '../common/PowerAccessDisplay';

export default function MonitoringSensor({ onBack }) {
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sensorData, setSensorData] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/with-room`);
        if (res.data.length > 0) {
          setUserList(res.data);
          setSelectedUser(res.data[0]);
        }
      } catch (err) {
        console.error("Gagal ambil users:", err);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchMonitoring = async () => {
      if (!selectedUser?.no_room) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/monitoring?kamar=${selectedUser.no_room}`);
        const formatted = res.data.sensor.map(item => ({
          time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suhu: item.suhu,
          kelembaban: item.kelembapan
        }));
        setSensorData(formatted);
      } catch (err) {
        console.error("Gagal ambil data sensor:", err);
      }
    };

    fetchMonitoring();
  }, [selectedUser]);

  return (
    <Box
      sx={{
        maxWidth: 414,
        mx: 'auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Sticky Header with Back Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '1px solid #eee',
          py: 1,
          px: 2,
        }}
      >
        <IconButton onClick={onBack} size="small">
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" ml={1}>
          Monitoring Sensor
        </Typography>
      </Box>

      {/* Konten Scrollable */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 2,
          pb: 4,
          pt: 3,
          paddingBottom: '80%',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
        }}
      >
        <Container maxWidth="sm" sx={{ px: 0 }}>
          {/* Dropdown */}
          <TextField
            select
            fullWidth
            label="Pilih Penghuni"
            value={selectedUser?.id || ''}
            onChange={(e) => {
              const user = userList.find(u => u.id === parseInt(e.target.value));
              setSelectedUser(user);
            }}
            variant="outlined"
            sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            {userList.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {`Kamar ${user.no_room} - ${user.username}`}
              </MenuItem>
            ))}
          </TextField>
          {/* Komponen Listrik dan Grafik */}
          {selectedUser && (
            <>
              <PowerAccessDisplay activeUntil={selectedUser.active_until} />
              <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                <Typography fontWeight="bold" mb={1}>
                  Grafik Suhu & Kelembaban
                </Typography>
                <SensorChart data={sensorData} />
              </Paper>
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
}
