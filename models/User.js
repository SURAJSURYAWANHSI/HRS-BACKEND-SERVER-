module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'WORKER' // ADMIN, WORKER, QC
        },
        is_online: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

    return User;
};
