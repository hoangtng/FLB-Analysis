import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db/conn';
import cors from 'cors';
import uploadRoutes from './routes/upload';
import delayRoutes from './routes/delays';



dotenv.config({ path: '../../.env' });



const app  = express();
const PORT = process.env.PORT || 4000;

// Connect to Database

connectDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
});


// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

// handling api URLs
app.use('/api/upload',    uploadRoutes);
app.use('/api/delays',    delayRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));


app.get('/', (req, res) => {
  res.send('API is running with TypeScript and MongoDB!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});