## Project Title
Backend for Chat Application

## Description
This is the backend service for a chat application built using Node.js and Prisma ORM. It provides RESTful APIs for user authentication, chat management, and message handling.

## Technologies Used
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Socket.IO for real-time communication
- JWT for authentication

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- PostgreSQL (version 12 or higher)
- Yarn or npm

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your environment variables:
   - Create a `.env` file in the root directory and add the following:
     ```
     DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database>
     JWT_SECRET=<your_jwt_secret>
     ```

4. Run database migrations:
   ```
   npx prisma migrate dev
   ```

5. Start the server:
   ```
   npm run start
   ```

### API Documentation
- Base URL: `http://localhost:5000/api`
- Authentication: Use JWT tokens for protected routes.

### Endpoints
- `POST /api/auth/login`: User login
- `POST /api/auth/register`: User registration
- `GET /api/chats`: Fetch all chats for the authenticated user
- `POST /api/chats`: Create a new chat
- `GET /api/chats/:chatId`: Fetch chat details
- `POST /api/chats/:chatId/messages`: Send a new message

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License
This project is licensed under the MIT License.

---



## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License
This project is licensed under the MIT License.
