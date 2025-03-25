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
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  },
  transports: ['websocket', 'polling']
});


io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  console.log('Connection attempt with token:', token);
  
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  // Verify token here
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret'); 
    socket.data.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connect', (socket) => {
  console.log('New client connected:', socket.id);


  socket.on('send-message', (data) => {
    console.log('Message received:', data);
    if (data.chatId) {
      console.log(`Sending message to room: ${data.chatId}`);
      io.to(data.chatId.toString()).emit('receive-message', data);
    }
  });


  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('join-room', (chatId) => {
    console.log(`Socket ${socket.id} joining room: ${chatId}`);
    socket.join(chatId.toString()); 
  });

  socket.on('leave-room', (chatId) => {
    console.log(`Socket ${socket.id} leaving room: ${chatId}`);
    socket.leave(chatId.toString()); 
  });

  socket.on('updated-message', (updatedMessage) => {
    console.log('Message updated:', updatedMessage);
    io.to(updatedMessage.chatId.toString()).emit('message-updated', updatedMessage);
  });
  
  socket.on('delete-message', (messageId) => {
    console.log('Message deleted:', messageId);
    socket.broadcast.emit('message-deleted', messageId); 
  });

  socket.on('block-user', async (data: { blockedId: number }) => {
    try {
      const userId = (socket.data.user as any).id;

      if (!data.blockedId) {
        console.error('Invalid blockedId');
        return;
      }
      
      // Broadcast to all relevant users
      io.to(userId.toString()).to(data.blockedId.toString()).emit('user-blocked', {
        blockerId: userId,
        blockedId: data.blockedId
      });
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  });
   
  socket.on('unblock-user', async (data: { blockedId: number }) => {
    try {
      const userId = (socket.data.user as any).id;

      if (!data.blockedId) {
        console.error('Invalid blockedId');
        return;
      }
      
      // Broadcast to all relevant users
      io.to(userId.toString()).to(data.blockedId.toString()).emit('user-unblocked', {
        blockerId: userId,
        blockedId: data.blockedId
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  });
});

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(cors({
  origin: process.env.FRONTEND_URL,
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