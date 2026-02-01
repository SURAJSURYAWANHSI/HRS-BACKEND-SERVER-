module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        sender_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        receiver_id: {
            type: DataTypes.STRING, // 'ADMIN' or Worker ID
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        type: {
            type: DataTypes.STRING,
            defaultValue: 'text' // text, image, audio
        },
        attachment_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

    return Message;
};
