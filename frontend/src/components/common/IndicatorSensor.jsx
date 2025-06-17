import React from 'react';
import { Typography, Grid, Box } from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat'; 
import OpacityIcon from '@mui/icons-material/Opacity'; 
import BoltIcon from '@mui/icons-material/Bolt'; 
import dayjs from 'dayjs';
import DynamicBoltIcon from './DynamicBoltIcon'; 

function IndicatorSensor({ temperature, humidity, activeUntil, color = '#FFFFFF', minTemp = 18, maxTemp = 30, minHum = 30, maxHum = 75 }) {
  const displayTemperature = temperature !== null ? `${temperature}°C` : 'N/A';
  const displayHumidity = humidity !== null ? `${humidity}%` : 'N/A';

  const isTemperatureOutOfRange = temperature !== null && (temperature < minTemp || temperature > maxTemp);
  const isHumidityOfRange = humidity !== null && (humidity < minHum || temperature > maxHum);

  const backgroundColor = isTemperatureOutOfRange ? '#FF495C' : '#5EC38B'; 
  const backgroundColor2 = isHumidityOfRange ? '#FF495C' : '#5EC38B'; 

  const maxHari = 30;
  let sisaHari = 0;
  let sisaJam = 0;
  let level = 0;

  if (activeUntil) {
    const now = dayjs();
    const until = dayjs(activeUntil);
    const durasi = until.diff(now, 'minute');
    sisaHari = Math.floor(durasi / 1440); 
    sisaJam = Math.floor((durasi % 1440) / 60);
    level = Math.max(0, Math.min(1, (sisaHari + sisaJam / 24) / maxHari));

  }
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 350,
        marginLeft: '35px',
        //marginRight: 'auto',
        marginTop: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Grid
        container
        spacing={2}
        sx={{
          justifyContent: 'center',
          width: '100%',
          // marginTop: '5px',
        }}
      >
        <Grid item xs={6}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: '16px',
              marginRight: '16px',
              background: 'linear-gradient(145deg,rgb(120, 209, 160), #5EC38B)',
              borderRadius: '30px',
              height: '160px',
              width: '110%',
              border: '2px solid #E7F4FB',
              transition: 'transform 0.3s ease, background 0.3s ease, border-color 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: '#E7F4FB',
                opacity: 0.85,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0px',
                marginLeft: '-20px',
              }}
            >
            <Box sx={{ position: 'relative', width: '100px', height: '100px' }}>
              <DynamicBoltIcon level={level} />
            </Box>
                <Typography variant="subtitle2" sx={{ color: '#FFFFFF', textAlign: 'center', fontSize: '0.9rem' }}>
                  Sisa Waktu <br />
                  {activeUntil ? `${sisaHari} Hari ${sisaJam} Jam` : 'Tidak Aktif'}
                </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Grid container spacing={2} sx={{ marginLeft: '16px' }}>
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  padding: '16px',
                  marginLeft: '26px',
                  background: backgroundColor,
                  borderRadius: '30px',
                  height: '55px',
                  width: '55px',
                  border: '2px solid #E7F4FB',
                  transition: 'transform 0.3s ease, background 0.3s ease, border-color 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: '#E7F4FB',
                    opacity: 0.85,
                  },
                }}
              >
                <ThermostatIcon fontSize="medium" sx={{ color: color }} />
                <Typography variant="h6" sx={{ mt: 1, color: '#FFFFFF' }}>
                  {displayTemperature}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  padding: '16px',
                  marginLeft: '26px',
                  background: backgroundColor2,
                  borderRadius: '30px',
                  height: '55px',
                  width: '55px',
                  border: '2px solid #E7F4FB',
                  transition: 'transform 0.3s ease, background 0.3s ease, border-color 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: '#E7F4FB',
                    opacity: 0.85,
                  },
                }}
              >
                <OpacityIcon fontSize="medium" sx={{ color: color }} />
                <Typography variant="h6" sx={{ mt: 1, color: '#FFFFFF' }}>
                  {displayHumidity}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

export default IndicatorSensor;