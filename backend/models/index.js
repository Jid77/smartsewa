const { Sequelize, DataTypes} = require('sequelize');
const parse = require('pg-connection-string').parse;

const isProduction = process.env.NODE_ENV === 'production';
const rawUrl = process.env.DATABASE_URL || 'postgresql://postgres:@localhost:5432/smartsewa';
const config = parse(rawUrl);

const sequelize = new Sequelize({
  username: config.user,
  password: config.password,
  database: config.database,
  host: config.host,
  port: config.port,
  dialect: 'postgres',
  dialectModule: require('pg'),
  logging: false,
  ...(isProduction && {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      }
    }
  })
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Muat model 
db.User = require('./user')(sequelize, Sequelize);
db.LaporanPembayaran = require('./laporanPembayaran')(sequelize, Sequelize);
db.History = require('./history')(sequelize, DataTypes);
db.SensorData = require('./sensorData')(sequelize, DataTypes);
db.ChatRoom = require('./chatRoom')(sequelize, DataTypes);
db.ChatMessage = require('./chatMessage')(sequelize, DataTypes);



// Relasi 
db.User.hasMany(db.LaporanPembayaran, { foreignKey: 'userId' });
db.LaporanPembayaran.belongsTo(db.User, { foreignKey: 'userId' });
db.History.belongsTo(db.User, { foreignKey: 'userId' });
db.History.belongsTo(db.LaporanPembayaran, { foreignKey: 'laporanId' });
db.LaporanPembayaran.hasMany(db.History, { foreignKey: 'laporanId' });
db.ChatRoom.belongsTo(db.User, { foreignKey: 'userId' });
db.User.hasOne(db.ChatRoom, { foreignKey: 'userId' });

db.ChatRoom.hasMany(db.ChatMessage, { foreignKey: 'roomId' });
db.ChatMessage.belongsTo(db.ChatRoom, { foreignKey: 'roomId' });
//sinkronisasi model
sequelize.sync({ alter: true })  // 
  .then(() => {
    console.log('Database synced!');
  })
  .catch((err) => {
    console.error('Gagal sync database:', err);
  });

module.exports = db;
