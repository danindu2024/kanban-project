import { Router } from "express";
import { BoardController } from "../controllers/boardController";
import { BoardRepository } from "../infrastructure/repositories/BoardRepository";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Composition Root - Create dependencies once
const boardRepository = new BoardRepository();
const userRepository = new UserRepository()
const boardController = new BoardController(boardRepository, userRepository);

// Apply Auth Middleware to all routes
router.use(protect);

// Route handlers
router.post("/", boardController.createBoard);
router.get("/", boardController.getBoards);
router.delete("/:id", boardController.deleteBoard)
router.post("/:id/members", boardController.addMembers)

export default router;