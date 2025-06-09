// ✅ FILE: src/components/user/UserChatContent.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import axios from 'axios';
import Pusher from 'pusher-js';
import TextareaAutosize from '@mui/material/TextareaAutosize';

function UserChatContent({ onBack }) {
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const pusherRef = useRef(null);
  const channelRef = useRef(null);

  const initializePusher = (roomId) => {
    if (pusherRef.current) {
      pusherRef.current.disconnect();
    }

    pusherRef.current = new Pusher('a0d012255f87110c4d74', {
      cluster: 'ap1',
    });

    const channel = pusherRef.current.subscribe(`chat-room-${roomId}`);
    channel.bind('new-message', (data) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.timestamp === data.timestamp && m.message === data.message);
        return exists ? prev : [...prev, data];
      });
    });

    channelRef.current = channel;
  };

  useEffect(() => {
    const fetchRoomAndMessages = async () => {
      try {
        const roomRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/my-room`, {
          withCredentials: true,
        });
        const roomId = roomRes.data.roomId;
        setRoomId(roomId);

        const msgRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/rooms/${roomId}/messages`, {
          withCredentials: true,
        });
        setMessages(msgRes.data);

        initializePusher(roomId);
      } catch (err) {
        console.error('Gagal load chat:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomAndMessages();

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const messageToSend = input;
    setInput('');

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/message`,
        { roomId, message: messageToSend },
        { withCredentials: true }
      );
    } catch (err) {
      console.error('Gagal kirim pesan:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (sameDay(date, today)) return 'Hari Ini';
    if (sameDay(date, yesterday)) return 'Kemarin';

    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return <Box textAlign="center" mt={5}><CircularProgress /></Box>;
  }

  let lastDate = null;

  return (
    <Box sx={{ height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 2,
          pt: 5,
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <IconButton size="small" onClick={onBack}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" ml={1}>
          Chat Admin
        </Typography>
      </Box>

      {/* Chat area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 2,
          py: 1,
          pb: 10,
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(0,0,0,0.3)',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.2) transparent',
        }}
      >
        {messages.map((msg, index) => {
          const msgDate = formatDate(msg.timestamp);
          const showDateSeparator = msgDate !== lastDate;
          lastDate = msgDate;

          return (
            <React.Fragment key={msg.id || index}>
              {showDateSeparator && (
                <Box textAlign="center" my={2}>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 0.5,
                      fontSize: '0.75rem',
                      color: '#666',
                      backgroundColor: '#eee',
                      display: 'inline-block',
                      borderRadius: '12px',
                    }}
                  >
                    {msgDate}
                  </Typography>
                </Box>
              )}
              <Box
                sx={{
                  mb: 1,
                  display: 'flex',
                  justifyContent: msg.sender === 'admin' ? 'flex-start' : 'flex-end',
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    maxWidth: '80%',
                    position: 'relative',
                    backgroundColor: msg.sender === 'admin' ? '#EEE' : '#DCF8C6',
                    color: 'black',
                    borderRadius:
                      msg.sender === 'admin'
                        ? '12px 12px 12px 0px'
                        : '12px 12px 0px 12px',
                    textAlign: 'left',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      bottom: 0,
                      ...(msg.sender === 'admin'
                        ? {
                            left: -5,
                            borderWidth: '10px 10px 0px 0px',
                            borderColor: 'transparent #EEE transparent transparent',
                          }
                        : {
                            right: -5,
                            borderWidth: '10px 0 0px 10px',
                            borderColor: 'transparent transparent transparent #DCF8C6',
                          }),
                    },
                  }}
                >
                  <>
                    {msg.message}
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        fontSize: '0.7rem',
                        color: 'gray',
                        textAlign: 'right',
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </Typography>
                  </>
                </Box>
              </Box>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop: '1px solid #eee',
          display: 'flex',
          gap: 1,
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#fff',
          zIndex: 5,
        }}
      >
        <TextareaAutosize
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pesan..."
          minRows={1}
          maxRows={5}
          style={{
            width: '100%',
            resize: 'none',
            padding: '10px 14px',
            borderRadius: '24px',
            border: '1px solid #ccc',
            fontSize: '16px',
            backgroundColor: '#f5f5f5',
            lineHeight: '1.5',
            outline: 'none',
          }}
        />
        <IconButton onClick={handleSend}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default UserChatContent;
