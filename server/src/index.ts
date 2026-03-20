import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import transactionRouter from './routes/transaction';
import configRouter from './routes/config';
import healthRouter from './routes/health';
import budgetRouter from './routes/budget';
import expenseRouter from './routes/expense';
import resetRouter from './routes/reset';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.use(cors());
app.use(express.json());

app.use('/api/transaction', transactionRouter);
app.use('/api/config', configRouter);
app.use('/api/health', healthRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/expense', expenseRouter);
app.use('/api/reset', resetRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Last Call server running on http://localhost:${PORT}`);
});

export default app;