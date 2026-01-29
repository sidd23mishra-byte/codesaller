import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser()); 

import userRoutes from './routes/user.routes'

app.use('/api/users', userRoutes)



export default app;