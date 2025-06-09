const express = require('express');
const cors = require('cors');
const session = require('express-session');
const db = require('./models'); 
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const historyRoutes = require('./routes/historyRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const relayRoutes = require('./routes/relayRoutes');
const chatRoutes = require('./routes/chatRoutes');
const createDefaultAdmin = require('./utils/createDefaultAdmin');

require('dotenv').config();

app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors({
  // origin: ['http://localhost:3000', 'http://localhost:5173'],
  origin: true,
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: 'smartsewa-secret', 
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000, // 1 hari
  },
}));

// route
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Route API
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', laporanRoutes);
app.use('/api', historyRoutes);
app.use('/api', sensorRoutes);
app.use('/api', relayRoutes);
app.use('/api/chat', chatRoutes);
// app.use('/api/user', userRoutes);

// Sinkronisasi database
db.sequelize.sync()
  .then(async () => {
    console.log("Database berhasil disinkronisasi.");
    await createDefaultAdmin(); 
  })
  .catch(err => console.error("Gagal sinkronisasi database: ", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
