import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from './config/passport';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import imageRoutes from './routes/imageRoutes';
import presignedUrlRoutes from './routes/presignedUrlRoutes';
import { sessionMiddleware } from './config/session';
import { errorHandler } from './middleware/errorHandler';
import methodOverride from 'method-override';
import messageRoutes from './routes/messageRoutes';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { prisma } from './models/prisma';
import oauthRoutes from './routes/oauthRoutes';
import fs from 'fs';
import https from 'https';
import path from 'path';
dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';
const API_URL = process.env.API_URL;

const app = express();

const keyPath = path.join(process.cwd(), 'server/localhost+1-key.pem');
const certPath = path.join(process.cwd(), 'server/localhost+1.pem');

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

console.log("CORS Origin being used:", process.env.FRONTEND_URL);

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

const server = https.createServer(options, app);

app.use((req, res, next) => {
  const domain = API_URL ? API_URL.replace(/^https?:\/\//, '') : '';

  const connectSrc = isDevelopment 
    ? `'self' http://localhost:* https://localhost:*`
    : `'self' ${API_URL} wss://${domain} https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com`;

  res.setHeader('Content-Security-Policy', 
    `default-src 'self'; ` +
    `connect-src ${connectSrc}; ` +
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'; ` +
    `style-src 'self' 'unsafe-inline'; ` +
    `img-src 'self' https://avatars.githubusercontent.com https://loremflickr.com https://*.cloudfront.net data: https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com; ` +
    `font-src 'self' https://fonts.googleapis.com data:`
  );
  next();
});


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


  socket.on('send-message', async (data) => {
    console.log('Message received:', data);
    if (data.chatId) {
      console.log(`Sending message to room: ${data.chatId}`);

      const updatedChat = await prisma.chat.findUnique({
        where: { id: data.chatId },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      });

      console.log('Updated chat:', updatedChat);
      io.to(data.chatId.toString()).emit('receive-message', {
        message: data,
        updatedChat
      });
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

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
  res.send('Hello HTTPS!');
});

app.use('/', authRoutes);
app.use('/', oauthRoutes);
app.use('/', userRoutes);
app.use('/', chatRoutes);
app.use('/', messageRoutes);
app.use('/', imageRoutes);
app.use('/', presignedUrlRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;


if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0' as any, () => {
    console.log('Server is running on port ' + PORT);
    console.log(`Open your browser and visit: ${API_URL}`);
  });
}

export default app;