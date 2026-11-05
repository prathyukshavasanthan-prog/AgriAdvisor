import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import farmRoutes, { getFarmIrrigationRecommendation, handleGetCropLifecycle } from './routes/farmRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import outbreakRoutes from './routes/outbreakRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import { authenticateToken, AuthenticatedRequest } from './middleware/authMiddleware.js';
import { getUserHealthAlerts } from './services/cropHealthService.js';
import { seedMarketPricesIfEmpty } from './services/marketService.js';
import { migrateExistingFarmLocations } from './services/outbreakService.js';
import { migrateExistingFarmsPhase1 } from './models/Farm.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5900;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev/docker testing
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check Endpoint (Required: curl http://localhost:5900/health)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'AgriAdvisor API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'AgriAdvisor API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/outbreaks', outbreakRoutes);
app.use('/api/assistant', assistantRoutes);

// Crop Lifecycle direct endpoint (Module 6)
app.get('/api/crops/:cropId/lifecycle', authenticateToken, handleGetCropLifecycle);

// Health alerts endpoint for dashboard overview
app.get('/api/health-alerts', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alerts = await getUserHealthAlerts(req.user?._id!);
    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error: any) {
    console.error('[App] Error retrieving health alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve health alerts',
      error: error.message,
    });
  }
});

app.get('/api/recommendations/:farmId', authenticateToken, getFarmIrrigationRecommendation);

// Global 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Start Server & Connect Database
const startServer = async () => {
  await connectDB();
  await seedMarketPricesIfEmpty();
  const migration = await migrateExistingFarmLocations();
  if (migration.migratedCount > 0) {
    console.log(`[Migration] Migrated ${migration.migratedCount} farms to GeoJSON Point location.`);
  }
  const phase1Migration = await migrateExistingFarmsPhase1();
  if (phase1Migration.migratedCount > 0) {
    console.log(`[Migration] Migrated ${phase1Migration.migratedCount} farms with Phase 1 defaults (land_type, water_source, irrigation_method, size_unit, awhc).`);
  }
  app.listen(PORT, () => {
    console.log(`[Server] AgriAdvisor Backend running on port ${PORT}`);
  });
};

startServer();

