import mongoose, { Schema, Document } from "mongoose";

export interface IBoardDocument extends Document {
  title: string;
  owner_id: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  created_at: Date;
}

const BoardSchema = new Schema<IBoardDocument>({
  title: { type: String, required: true },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  created_at: { type: Date, default: Date.now },
});

export const BoardModel = mongoose.model<IBoardDocument>("Board", BoardSchema);