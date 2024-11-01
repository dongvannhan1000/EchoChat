import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from './config/passport';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import { sessionMiddleware } from './config/session';
import { errorHandler } from './middleware/errorHandler';
import methodOverride from 'method-override';
import messageRoutes from './routes/messageRoutes';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
  res.send('Welcome to the Blog API!');
});

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', chatRoutes);
app.use('/', messageRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open your browser and visit: http://localhost:${PORT}`);
});