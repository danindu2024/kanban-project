import { Router } from "express";
import { createBoard, getBoards } from "../controllers/boardController";
import { protect } from "../middleware/authMiddleware"; // Assuming you named it 'protect'

const router = Router();

// Apply Auth Middleware to all routes
router.use(protect);

router.post("/", createBoard);
router.get("/", getBoards);

export default router;