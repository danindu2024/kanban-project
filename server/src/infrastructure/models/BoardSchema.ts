import mongoose, { Schema, Document } from "mongoose";

export interface IBoardDocument extends Document {
  title: string;
  owner_id: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}

const BoardSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User', defualt: [] }],
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
}
);

export default mongoose.model<IBoardDocument>("Board", BoardSchema);