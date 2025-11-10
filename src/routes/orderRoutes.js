import express from 'express';
import { createOrder, getOrderHistory, getOrderDetail } from '../controllers/orderController.js';

const router = express.Router();


router.post("/checkout", createOrder); 
router.get("/history", getOrderHistory);
router.get("/detail/:order_id", getOrderDetail);

export default router;