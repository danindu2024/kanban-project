import mongoose, { Schema, Document} from 'mongoose';
import { Priority } from '../../domain/entities/Task';

export interface ITaskDocument extends Document {
  column_id: mongoose.Types.ObjectId;
  board_id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  priority: Priority;
  assignee_id?: Schema.Types.ObjectId;
  order: number;
  created_at: Date;
}

const TaskSchema: Schema = new Schema({
  column_id: { type: Schema.Types.ObjectId, ref: 'Column', required: true },
  board_id: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
  assignee_id: { type: Schema.Types.ObjectId, ref: 'User' },
  order: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

TaskSchema.index({ column_id: 1 });
TaskSchema.index({ board_id: 1 });

export default mongoose.model<ITaskDocument>("Task", TaskSchema)