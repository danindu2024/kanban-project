import { Router } from "express";
import { BoardController } from "../controllers/boardController";
import { BoardRepository } from "../infrastructure/repositories/BoardRepository";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Composition Root - Create dependencies once
const boardRepository = new BoardRepository();
const boardController = new BoardController(boardRepository);

// Apply Auth Middleware to all routes
router.use(protect);

// Route handlers
router.post("/", boardController.createBoard);
router.get("/", boardController.getBoards);

export default router;