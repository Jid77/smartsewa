    import React from 'react';
    import { Typography, Box } from '@mui/material';

    const CommonGreeting = ({ username, appName = "Smartsewa", sx }) => {
    return (
        <Box
        sx={{
            position: 'fixed',
            zIndex: 1,
            paddingLeft: '16px',
            ...sx
        }}
        >
        <Typography variant="h5" fontWeight="bold" textAlign="left" sx={{ mt: 5, marginLeft: '5px' }}>
            Hi {username}
        </Typography>
        <Typography variant="subtitle2" sx={{ mt: '5px', textAlign: 'left', marginLeft: '5px', mb: '2px' }}>
            Selamat datang di <b>{appName}</b>
        </Typography>
        </Box>
    );
    };

    export default CommonGreeting;