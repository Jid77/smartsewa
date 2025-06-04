import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Snackbar,
  TextField,
  Alert,
} from '@mui/material';
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
        const res = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/profile`,
          formData,
          { withCredentials: true }
        );

        setSuccessMessage(res.data.message || 'Profil berhasil diperbarui');
        setErrorMessage('');
        setIsEditing(false);
        setUser(res.data.user); // update state global
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

  return (
    <Box
      sx={{
        height: 'calc(100vh - 200px)',
        overflow: 'hidden',
        px: 2,
      }}
    >
        {/* Scrollable Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 3,
            py: 4,
          }}
        >
          {/* Avatar & Username */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mb: 2,
                bgcolor: '#5EC38B',
                fontSize: '2.5rem',
              }}
            >
            </Avatar>
          </Box>

        {/* Feedback Message */}
        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

          {/* Informasi Akun */}
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
          <TextField
            fullWidth
            name="email"
            value={formData.email}
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
          <Box sx={inputStyle}>{user?.email}</Box>
        )}

          {user?.role === 'user' && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
                No. Kost
              </Typography>
              <Box sx={inputStyle}>
                {user?.no_room ? user.no_room : 'Belum ada'}
              </Box>
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
          <Snackbar open={!!successMessage} autoHideDuration={2000} onClose={() => setSuccessMessage('')}>
            <Alert severity="success" sx={{ borderRadius: 2 }}>{successMessage}</Alert>
          </Snackbar>
          <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage('')}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>{errorMessage}</Alert>
          </Snackbar>
        </Box>
      
    );
  }

const inputStyle = {
    mt: 0,
  mb: 1,
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid #ddd',
  fontSize: '1rem',
};

export default ProfileContent;
