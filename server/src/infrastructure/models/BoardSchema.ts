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
  members: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  // Enable virtuals in JSON response
  toJSON: {virtuals: true},
  toObject: {virtuals: true},
  id: false // Disable duplicate 'id' field if _id exists
}
);

// Define the Virtual Relationship
BoardSchema.virtual('columns', {
  ref: 'Column',           
  localField: '_id',     // Find tasks where `localField`
  foreignField: 'board_id', // is equal to `foreignField`
  options: { sort: { order: 1 } } // Default sort by order
});

export default mongoose.model<IBoardDocument>("Board", BoardSchema);