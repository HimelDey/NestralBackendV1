import './config/mongoose.config'; // Must be first — before any model import
import app from './app';
import { config } from './config';
import { connectDB } from './config/db';
import logger from './utils/logger';

const startServer = async () => {
    await connectDB();

    app.listen(config.port, () => {
        logger.info(`Server running in ${config.env} mode on port ${config.port}`);
    });
};

startServer();
