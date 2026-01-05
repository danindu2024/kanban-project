import { IColumnRepository } from '../../domain/repositories/IColumnRepository';
import { Column as ColumnEntity} from '../../domain/entities/Column';
import ColumnModel, { IColumnDocument } from '../models/ColumnSchema';

export class ColumnRepository implements IColumnRepository {

    async create(columnData: 
        { board_id: string; 
          title: string; 
          order: number;}): Promise<ColumnEntity>{
        const newColumn = new ColumnModel(columnData);
        const savedColumn = await newColumn.save();

        return this.mapToEntity(savedColumn);
    }

    async findByBoardId(boardId: string): Promise<ColumnEntity[]> {
        const columnDocs = await ColumnModel
          .find({board_id: boardId})
          .sort({ order: 1 });

        return columnDocs.map(doc => this.mapToEntity(doc));
    }

    async  update(columnId: string, updateData: Partial<ColumnEntity>): Promise<ColumnEntity | null>{
        const updatedColumn = await ColumnModel.findByIdAndUpdate(
          columnId,
          updateData,
          { new: true, runValidators: true }
        );
        return updatedColumn ? this.mapToEntity(updatedColumn) : null;
    }

    async  findById(id: string): Promise<ColumnEntity | null>{
        const columnDoc =  await ColumnModel.findById(id);
        return columnDoc ? this.mapToEntity(columnDoc) : null;
    }

    private mapToEntity(doc: IColumnDocument): ColumnEntity {
        return {
          id: doc._id.toString(),
          board_id: doc.board_id.toString(),
          title: doc.title,
          order: doc.order,
          // The tasks will be attached in the Use Case layer
          tasks: undefined,
          created_at: doc.created_at
        }
    }
}