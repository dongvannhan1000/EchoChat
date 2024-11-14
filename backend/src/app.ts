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
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  console.log('Connection attempt with token:', token);
  
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  // Verify token here
  try {
    // Verify token logic
    next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);


  socket.on('message', (data) => {
    console.log('Message received:', data);
  });


  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
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

if (process.env.NODE_ENV !== 'test') {
  server.listen(5000, () => {
    console.log('Server is running on port 5000');
    console.log('Open your browser and visit: http://localhost:5000');
  });
}

export default app;