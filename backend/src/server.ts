import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db/conn';
import cors from 'cors';
import uploadRoutes from './routes/upload';
import delayRoutes from './routes/delays';
import alertRoutes from './routes/alerts';
import summariesRoutes from './routes/summaries';
import helmet from 'helmet';
import morgan from 'morgan';



//dotenv.config({ path: './.env' });
dotenv.config();
const app  = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*' }));   // nginx handles real CORS in production
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// handling api URLs
app.use('/api/upload',    uploadRoutes);
app.use('/api/delays',    delayRoutes);
app.use('/api/alerts',    alertRoutes);
app.use('/api/summaries',  summariesRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/',           (_req, res) => res.send('FLB API running'));


app.get('/', (req, res) => {
  res.send('API is running with TypeScript and MongoDB!');
});

// Connect to Database
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not set — AI endpoints will fail');
    } else {
      console.log('✅ OpenAI API key loaded');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});