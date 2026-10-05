import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

import authRoutes from './routes/auth.js';
import teacherRoutes from './routes/teachers.js';
import subscriptionRoutes from './routes/subscriptions.js';
import progressRoutes from './routes/progress.js';
import teacherDashboardRoutes from './routes/teacherDashboard.js';
import adminRoutes from './routes/admin.js';
import reviewRoutes from './routes/reviews.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/teacher-dashboard', teacherDashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Korsa API Server'
  });
});

// Serve frontend static files
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Initialize & Seed Database, then Start Server
async function startServer() {
  try {
    await initDatabase();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`🚀 Korsa Backend API running on http://localhost:${PORT}`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
