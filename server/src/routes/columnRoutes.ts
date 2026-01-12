import { ColumnController } from "../controllers/columnController";
import { ColumnRepository } from "../infrastructure/repositories/ColumnRepository";
import { BoardRepository } from "../infrastructure/repositories/BoardRepository";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { Router } from "express";
import {protect} from '../middleware/authMiddleware'

const columnRepository = new ColumnRepository()
const boardRepository = new BoardRepository()
const userRepository = new UserRepository()

const columnController = new ColumnController(columnRepository, boardRepository, userRepository)

const router = Router()

router.use(protect)

router.post("/", columnController.createColumn)
router.patch("/:id", columnController.updateColumn)
router.patch("/:id/order", columnController.moveColumn)

export default router