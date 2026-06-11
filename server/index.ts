import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRouter from './routes/auth';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', webinfo: config.webinfo.url });
});

app.listen(config.port, () => {
  console.log(`[서버] http://localhost:${config.port} 실행 중`);
  console.log(`[DB]   ${config.webinfo.url}`);
});
