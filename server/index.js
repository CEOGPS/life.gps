// server/index.js
import express from 'express';
import cors from 'cors';
import { createRouter } from '../src/api/router.js';
import apiRoutes from '../src/api/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'email-api' });
});

app.listen(PORT, () => {
  console.log(`Email API server running on port ${PORT}`);
});