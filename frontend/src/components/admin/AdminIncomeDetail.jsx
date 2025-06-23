import React, { useEffect, useState } from 'react';
import {
Box,
Typography,
MenuItem,
FormControl,
Select,
InputLabel,
List,
ListItem,
ListItemText,
CircularProgress,
IconButton
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/id'; 
dayjs.locale('id');

const AdminIncomeDetail = ({ onBack }) => {
    const [bulan, setBulan] = useState(dayjs().format('YYYY-MM'));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;

    const fetchPendapatan = async (bulan) => {
        setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/api/laporan-pembayaran/pendapatan?bulan=${bulan}`);
        setData(res.data);
    } catch (err) {
        console.error('Gagal ambil pendapatan:', err);
        setData(null);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchPendapatan(bulan);
    }, [bulan]);

    const handleChange = (e) => {
        setBulan(e.target.value);
    };

const generateBulanOptions = () => {
    const options = [];
    const now = dayjs();
    for (let i = 0; i < 12; i++) {
        const bulanIterasi = now.subtract(i, 'month').format('YYYY-MM');
        options.push(
        <MenuItem key={bulanIterasi} value={bulanIterasi}>
            {dayjs(bulanIterasi).locale('id').format('MMMM YYYY')}
        </MenuItem>
    );
    }
    return options;
};

return (
<Box
    sx={{
        width: '100%',
        maxWidth: 414,
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        mx: 'auto',
    }}
>
<Box
    sx={{
        px: 2,
        pt: 2,
        pb: 1,
        borderBottom: '1px solid #eee',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
    }}
>
    <IconButton size="small" onClick={onBack}>
        <ArrowBackIosNewIcon fontSize="small" />
    </IconButton>
    <Typography variant="h6" fontWeight="bold" ml={1}>
        Rekap Pendapatan
    </Typography>
</Box>

<Box
    sx={{
        py: 1,
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee',
        mx: '29px', 
    }}
>
    <Box>
        <Typography variant="body2" fontWeight="bold" color="text.secondary">
            Total Pendapatan Bulan {dayjs(bulan).locale('id').format('MMMM YYYY')}
        </Typography>
        <Typography variant="h6" color="success.main" fontWeight="bold">
            Rp {data?.totalPendapatan.toLocaleString('id-ID')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
            {data?.jumlahTransaksi ?? 0} transaksi dikonfirmasi
        </Typography>
    </Box>

    <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Bulan</InputLabel>
        <Select value={bulan} label="Bulan" onChange={handleChange} sx={{ borderRadius: 4 }}>
            {generateBulanOptions()}
        </Select>
    </FormControl>
</Box>

    {loading ? (
    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
    </Box>
    ) : data ? (
    <Box sx={{ px: 2, overflowY: 'auto', pb: '80px' }}>
        <List>
            {data.rincian.map((item) => (
            <ListItem key={item.id} divider>
                <ListItemText
                    primary={`${item.user.username} (Kamar ${item.user.no_room}) - Rp${Number(item.jumlah).toLocaleString('id-ID')}`}
                    secondary={`Periode: ${item.periode} | Tanggal: ${dayjs(item.tanggal).format('DD/MM/YYYY')}`}
                />
            </ListItem>
            ))}
        </List>
    </Box>
        ) : (
        <Typography sx={{ p: 2 }} color="text.secondary">
            Tidak ada data untuk bulan ini.
        </Typography>
        )}
    </Box>
    );
};

export default AdminIncomeDetail;
