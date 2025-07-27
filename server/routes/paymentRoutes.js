import { initializePayment, handlePaymentSuccess, handleWebhook } from "../controllers/Payment.js";
import express from "express";

const router = express.Router();

router.post("/stripe", initializePayment);
router.get("/success", handlePaymentSuccess);
router.post("/webhook", express.raw({ type: 'application/json' }), handleWebhook);
router.get("/cancel", (req, res) => {
    res.send("Payment cancelled");
}
);


export default router;