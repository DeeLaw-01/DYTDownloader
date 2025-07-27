import express from "express";
import { createNewsletter, getNewsletters } from "../controllers/Newsletter.js";

const router = express.Router();

router.post("/", createNewsletter);
router.get("/", getNewsletters);

export default router;