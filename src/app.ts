import express, { Application, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './modules/auth/auth.routes';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
import propertyRoutes from './modules/properties/property.routes';
import propertyLayoutRoutes from './modules/layouts/property-layout.routes';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/reports', express.static(path.join(process.cwd(), 'reports')));

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Nestral Backend API' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/property-layouts', propertyLayoutRoutes);

app.use(errorHandler);

export default app;