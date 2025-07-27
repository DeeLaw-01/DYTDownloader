import express from "express";
import { createContact } from "../controllers/Contact.js";

const router = express.Router();

router.post("/", createContact);

export default router;