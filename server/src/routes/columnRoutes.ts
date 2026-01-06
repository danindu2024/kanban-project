import { ColumnController } from "../controllers/columnController";
import { ColumnRepository } from "../infrastructure/repositories/ColumnRepository";
import { BoardRepository } from "../infrastructure/repositories/BoardRepository";
import { Router } from "express";
import {protect} from '../middleware/authMiddleware'

const columnRepository = new ColumnRepository()
const boardRepository = new BoardRepository()
const columnController = new ColumnController(columnRepository, boardRepository)

const router = Router()

router.use(protect)

router.post("/", columnController.createColumn)

// rename title
router.patch("/:id", columnController.updateColumn)

// drag and drop
router.patch("/:id/order", columnController.updateColumn)

export default router