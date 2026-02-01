const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Setup SQLite DB
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'), // DB file in backend root
    logging: false
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import Models
db.Job = require('./Job')(sequelize, DataTypes);
db.Message = require('./Message')(sequelize, DataTypes);
db.User = require('./User')(sequelize, DataTypes);

module.exports = db;
