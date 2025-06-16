import express from 'express';
import oauthRoutes from '../../src/routes/oauthRoutes';

export const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(oauthRoutes);
  return app;
};
