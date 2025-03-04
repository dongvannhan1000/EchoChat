## Project Title
Frontend for Chat Application

## Description
This is the frontend client for a chat application built using React and Zustand for state management. It provides a user-friendly interface for chatting, managing contacts, and viewing messages in real-time.

## Technologies Used
- React
- Zustand for state management
- Axios for API requests
- Socket.IO for real-time communication
- Tailwind CSS for styling

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- Yarn or npm

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your environment variables:
   - Create a `.env` file in the root directory and add the following:
     ```
     VITE_BACKEND_URL=http://localhost:5000
     ```

4. Start the development server:
   ```
   npm run dev
   ```

### Features
- User authentication (login and registration)
- Real-time chat functionality
- Group and private chat support
- Message sending and receiving
- User blocking and unblocking

## API Integration
The frontend communicates with the backend through RESTful APIs. Ensure the backend is running before starting the frontend.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config(
{
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
