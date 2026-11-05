import process from 'process';
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const isConfiguredUri = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/agriadvisor';
  const timeoutMS = isConfiguredUri ? 10000 : 2500;
  
  try {
    const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: timeoutMS });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return;
  } catch (error: any) {
    console.warn(`[Database] External MongoDB not reached at ${mongoURI} (${error.message}). Initializing local Mongo instance...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: { dbName: 'agriadvisor' }
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`[Database] Local MongoDB engine initialized and connected successfully at: ${uri}`);
    } catch (memErr: any) {
      console.error('[Database Error] Failed to initialize database:', memErr.message);
      process.exit(1);
    }
  }
};
