import { Router } from "express";
import { BoardController } from "../controllers/boardController";
import { BoardRepository } from "../infrastructure/repositories/BoardRepository";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { TaskRepository } from "../infrastructure/repositories/TaskRepository";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Composition Root - Create dependencies once
const boardRepository = new BoardRepository();
const userRepository = new UserRepository()
const taskRepository = new TaskRepository()
const boardController = new BoardController(boardRepository, userRepository, taskRepository);

// Apply Auth Middleware to all routes
router.use(protect);

// Route handlers
router.post("/", boardController.createBoard);
router.get("/", boardController.getUserBoards);
router.delete("/:id", boardController.deleteBoard)
router.post("/:id/members", boardController.addMembers)
router.delete("/:id/members/:userId", boardController.removeMember)
router.patch("/:id", boardController.updateBoard)
router.get("/:id", boardController.getBoard)

export default router;