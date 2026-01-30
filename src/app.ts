import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser()); 

import userRoutes from './routes/user.routes'
import template from './routes/template.routes'

app.use('/api/users', userRoutes)
app.use('/api/template', template)



export default app;