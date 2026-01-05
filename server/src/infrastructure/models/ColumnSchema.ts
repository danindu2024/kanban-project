import mongoose, {Schema, Document} from "mongoose";

export interface IColumnDocument extends Document {
    board_id: mongoose.Types.ObjectId;
    title: string;
    order: number;
    created_at: Date;
}

const ColumnSchema: Schema = new Schema({
    board_id: {type: Schema.Types.ObjectId, ref: "Board", required: true},
    title: {type: String, required: true},
    order: {type: Number, required: true},
    created_at: {type: Date, default: Date.now}
})

ColumnSchema.index({ board_id: 1 });

export default mongoose.model<IColumnDocument>("Column", ColumnSchema)
