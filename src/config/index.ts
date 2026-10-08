import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI || 'mongodb+srv://himelhimu6_db_user:nestral-app@cluster0.vxlpsqd.mongodb.net/?appName=Cluster0',
    env: process.env.NODE_ENV || 'development',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production',
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1000m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
