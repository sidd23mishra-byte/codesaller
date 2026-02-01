import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser()); 

// Routes
import userRoutes from './routes/user.routes';
import templateRoutes from './routes/template.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from "./routes/payment.routes";
import categoryRoutes from './routes/category.routes';
import sellerRoutes from "./routes/seller.routes";
import reviewRoutes from "./routes/review.routes";

app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);    
app.use('/api/orders', orderRoutes);           
app.use('/api/payments', paymentRoutes);     
app.use('/api/categories', categoryRoutes);   
app.use('/api/sellers', sellerRoutes);      
app.use('/api/reviews', reviewRoutes);         

export default app;
