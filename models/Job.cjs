module.exports = (sequelize, DataTypes) => {
    const Job = sequelize.define('Job', {
        job_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        design_image: {
            type: DataTypes.STRING, // URL or base64
            allowNull: true
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'PENDING' // PENDING, IN_PROGRESS, COMPLETED
        },
        assigned_worker: {
            type: DataTypes.STRING,
            allowNull: true
        },
        priority: {
            type: DataTypes.STRING,
            defaultValue: 'NORMAL'
        },
        customer_name: {
            type: DataTypes.STRING
        }
    });

    return Job;
};
