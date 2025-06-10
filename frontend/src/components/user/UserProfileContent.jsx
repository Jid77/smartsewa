import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Snackbar,
  TextField,
  Alert
} from '@mui/material';
import { useEffect } from 'react';

import axios from 'axios';

function ProfileContent({ user, setUser, handleLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/profile`, formData, {
        withCredentials: true,
      });

      const updatedUser = {
        ...user, // jaga createdAt tetap ada
        ...res.data.user,
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccessMessage(res.data.message || 'Profil berhasil diperbarui');
      setErrorMessage('');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        setErrorMessage('Email sudah digunakan oleh pengguna lain.');
      } else {
        setErrorMessage('Gagal memperbarui profil.');
      }
      setSuccessMessage('');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };
  
  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser?.id) return;

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${storedUser.id}`);
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (err) {
        console.error('Gagal mengambil data user:', err);
      }
    };

    fetchUser();
  }, []);

  return (
    <Box
  sx={{
    height: 'calc(100vh - 200px)',
    px: 2,
    pt: 8,
    display: 'flex',
    flexDirection: 'column',
  }}
>
  {/* Avatar (tidak scrollable) */}
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <Avatar
      sx={{
        width: 100,
        height: 100,
        mb: 2,
        bgcolor: '#5EC38B',
        fontSize: '2.5rem',
      }}
    />
  </Box>



  {/* Scrollable Area */}
  <Box
    sx={{
      flex: 1,
      overflowY: 'auto',
      mt: 2,
      px: 1,
      pb: 4,
    }}
  >
    {/* Isi informasi akun */}
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
      Nama
    </Typography>
    {isEditing ? (
            <TextField
              fullWidth
              name="username"
              value={formData.username}
              onChange={handleChange}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                },
              }}
              inputProps={{
                style: { padding: 0 }
              }}
            />
          ) : (
            <Box sx={inputStyle}>{user?.username}</Box>
    )}

    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
      Email
    </Typography>
    {isEditing ? (
      <TextField fullWidth name="email" value={formData.email} onChange={handleChange} variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                },
              }}
              inputProps={{
                style: { padding: 0 }
              }}
            />
            ) : (
      <Box sx={inputStyle}>{user?.email}</Box>
    )}

    {user?.role === 'user' && (
      <>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
          No. Kost
        </Typography>
        <Box sx={inputStyle}>{user?.no_room || 'Belum ada'}</Box>
      </>
    )}

    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
      Bergabung sejak
    </Typography>
    <Box sx={inputStyle}>
      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
    </Box>

    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 4 }}>
      {isEditing ? (
        <>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                bgcolor: '#5EC38B',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 4,
                minWidth: '120px',
                py: 1.5,
                '&:hover': { backgroundColor: '#45A773' },
              }}
            >
              Simpan
            </Button>
            <Button
              variant="contained"
              onClick={handleCancel}
              sx={{
                bgcolor: '#FF4D4D',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 4,
                minWidth: '100px',
                py: 1.5,
                '&:hover': { backgroundColor: '#FF1A1A' },
              }}
            >
              Batal
            </Button>
          </Box>
        </>
      ) : (
          <Button
                fullWidth
                variant="outlined"
                onClick={() => setIsEditing(true)}
                sx={{ 
                  fontWeight: 'bold',
                  textTransform: 'none',
                  color: 'black',
                  py: 1.5,
                  maxWidth: '60%',
                  borderRadius: 4,
                  border: '1px solid #ddd',}}
              >
                Edit Profil
              </Button>
      )}

      <Button
        fullWidth
        onClick={handleLogout}
        sx={{
          bgcolor: '#FF4D4D',
          fontWeight: 'bold',
          textTransform: 'none',
          color: '#fff',
          py: 1.5,
          mb: 2,
          maxWidth: '60%',
          borderRadius: 4,
          '&:hover': { backgroundColor: '#FF1A1A' },
        }}
      >
        Keluar
      </Button>
    </Box>
  </Box>

    {/* Notifikasi */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={2000}
          onClose={() => setSuccessMessage('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ borderRadius: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!errorMessage}
          autoHideDuration={3000}
          onClose={() => setErrorMessage('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        </Snackbar>
  </Box>

      );
    }

const inputStyle = {
  // backgroundColor: '#fff',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid #ddd',
  fontSize: '1rem',
};

export default ProfileContent;
