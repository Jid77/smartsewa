// src/pages/admin/AdminPages.jsx
import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

import MobileContainer from '../../components/common/MobileContainer';
import HomeContent from '../../components/admin/AdminHomeContent';
import HistoryContent from '../../components/admin/AdminHistoryContent';
import ProfileContent from '../../components/admin/AdminProfileContent';
import CommonGreeting from '../../components/common/CommonGreeting';
import CommonBackground from '../../components/common/CommonBackground';
import CommonBottomNavigation from '../../components/common/CommonBottomNavigation';
import AdminReportPayment from '../../components/admin/AdminReportPayment';
import AdminReportDetail from '../../components/admin/AdminReportDetail';
import AdminUserList from '../../components/admin/AdminUserList';
import AdminUserDetail from '../../components/admin/AdminUserDetail';
import MonitoringSensor from '../../components/admin/MonitoringSensor';
import AdminUserPaymentHistory from '../../components/admin/AdminUserPaymentHistory';
import AdminUserPaymentHistoryDetail from '../../components/admin/AdminUserPaymentHistoryDetail';
import AdminChatRoomList from '../../components/admin/AdminChatRoomList';
import AdminChatRoomDetail from '../../components/admin/AdminChatRoomDetail';
import AdminIncomeDetail from '../../components/admin/AdminIncomeDetail';
import HistoryIcon from '@mui/icons-material/History';
import bgTop from '../../assets/Cloud.png';
import bgBottom from '../../assets/Cloud3.png';
import homeIcon from '../../assets/homeIcon.png';
import homeIconSelected from '../../assets/homeIconSelected.png';
import profileIcon from '../../assets/profileIcon.png';
import profileIconSelected from '../../assets/profileIconSelected.png';

function AdminPages({ user, setUser }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [activePage, setActivePage] = useState('home');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null); 
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState(null);
  const hideBottomNavPages = ['chatRoomDetail']; 
  const showBottomNav = !hideBottomNavPages.includes(activePage);


  const navigationTabs = [
    { icon: <img src={tab === 0 ? homeIconSelected : homeIcon} width="20" /> },
    { icon: <HistoryIcon /> },
    { icon: <img src={tab === 2 ? profileIconSelected : profileIcon} width="20" /> },
  ];

  const handleLogout = async () => {
    await axios.post(`${import.meta.env.VITE_API_URL}/api/logout`, {}, { withCredentials: true });
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };
  

  const renderContent = () => {
    if (activePage === 'laporanList') {
      return (
        <AdminReportPayment
          onBack={() => setActivePage('home')}
          onSelectReport={(id) => {
            setSelectedReportId(id);
            setActivePage('laporanDetail');
          }}
          onViewIncomeDetail={() => setActivePage('incomeDetail')}
        />
      );
    }

    if (activePage === 'laporanDetail') {
      return (
        <AdminReportDetail
          reportId={selectedReportId}
          onBack={() => setActivePage('laporanList')}
        />
      );
    }

    if (activePage === 'dataPenghuni') {
      return (
        <AdminUserList
          onBack={() => setActivePage('home')}
          onSelectUser={(id) => {
            setSelectedUserId(id);
            setActivePage('userDetail');
          }}
        />
      );
    }

    if (activePage === 'userDetail') {
      return (
        <AdminUserDetail
          userId={selectedUserId}
          onBack={() => setActivePage('dataPenghuni')}
          onViewPaymentHistory={() => setActivePage('userPaymentHistory')}
        />
      );
    }

    if (activePage === 'userPaymentHistory') {
      return (
        <AdminUserPaymentHistory
          userId={selectedUserId}
          onBack={() => setActivePage('userDetail')}
          onSelectPayment={(id) => {
            setSelectedPaymentId(id);
            setActivePage('userPaymentHistoryDetail');
          }}
        />
      );
    }
    
    if (activePage === 'userPaymentHistoryDetail') {
      return (
        <AdminUserPaymentHistoryDetail
          paymentId={selectedPaymentId}
          onBack={() => setActivePage('userPaymentHistory')}
        />
      );
    }

    if (activePage === 'monitoring') {
      return (
        <MonitoringSensor
          onBack={() => setActivePage('home')}
        />
      );
    }
    if (activePage === 'chatRoomList') {
      return (
        <AdminChatRoomList
          onBack={() => setActivePage('home')}
          onSelectRoom={(roomId) => {
            setSelectedChatRoomId(roomId);
            setActivePage('chatRoomDetail');
          }}
        />
      );
    }

    if (activePage === 'chatRoomDetail') {
      return (
        <AdminChatRoomDetail
          roomId={selectedChatRoomId}
          onBack={() => setActivePage('chatRoomList')}
        />
      );
    }
    
    if (activePage === 'incomeDetail') {
      return (
        <AdminIncomeDetail
          onBack={() => setActivePage('laporanList')}
        />
      );
    }



    if (tab === 0) {
      return (
        <HomeContent
          onOpenLaporan={() => setActivePage('laporanList')}
          onOpenDataPenghuni={() => setActivePage('dataPenghuni')}
          onOpenMonitoring={()=> setActivePage('monitoring')}
          onOpenPaymentHistory={(id) => {
            setSelectedUserId(id);
            setActivePage('userPaymentHistory');
          }}
          onOpenChatRoom={() => setActivePage('chatRoomList')}
        />
      );
    }

    if (tab === 1) return <HistoryContent />;
    if (tab === 2) return <ProfileContent user={user} setUser={setUser} handleLogout={handleLogout} />;
  };

  if (!user) return <Navigate to="/" />;

  return (
    <MobileContainer>
      <CommonBackground
        bgTop={bgTop}
        bgBottom={bgBottom}
        sx={{ position: 'fixed', top: 0, left: 0, zIndex: 0 }}
      />
      <CommonGreeting
        username={user.username}
        appName="Smartsewa"
        sx={{
          position: 'fixed',
          width: '100%',
          zIndex: 2,
          padding: '16px',
        }}
      />
      <Box
        sx={{
          height: 'calc(100vh - 200px)',
          pt: '130px',
          pb: '56px',
          position: 'relative',
          zIndex: 0,
        }}
      >
        {renderContent()}
      </Box>

      {showBottomNav && (
        <CommonBottomNavigation
          value={tab}
          onChange={(_, newValue) => {
            setTab(newValue);
            setActivePage('home');
          }}
          tabs={navigationTabs}
          selectedColor="#5EC38B"
        />
      )}
    </MobileContainer>
  );
}

export default AdminPages;
