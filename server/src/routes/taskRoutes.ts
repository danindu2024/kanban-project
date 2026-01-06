import { TaskController } from "../controllers/taskController";
import { ColumnRepository } from "../infrastructure/repositories/ColumnRepository";
import { BoardRepository } from "../infrastructure/repositories/BoardRepository";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { TaskRepository } from "../infrastructure/repositories/TaskRepository";
import { Router } from "express";
import { protect } from "../middleware/authMiddleware";

const columnRepository = new ColumnRepository()
const boardRepository = new BoardRepository()
const userRepository = new UserRepository()
const taskRepository = new TaskRepository()

const taskController = new TaskController(
    taskRepository, columnRepository, boardRepository, userRepository)

const router = Router()

router.use(protect)

router.post("/", taskController.createTask)
router.patch("/:id", taskController.updateTask)
router.patch("/:id/move", taskController.moveTask)
router.delete("/:id", taskController.deleteTask)

export default router

