import mongoose, {Schema, Document} from "mongoose";

export interface IColumnDocument extends Document {
    board_id: mongoose.Types.ObjectId;
    title: string;
    order: number;
    created_at: Date;
    updated_at: Date;
}

const ColumnSchema: Schema = new Schema({
    board_id: {type: Schema.Types.ObjectId, ref: "Board", required: true},
    title: {type: String, required: true, trim: true},
    order: {type: Number, required: true},
}, {
    timestamps: { 
        createdAt: 'created_at', // Map to snake_case names
        updatedAt: 'updated_at' 
    },
    // Enable virtuals in JSON response
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
    id: false // Disable duplicate 'id' field if _id exists
})

// Define the Virtual Relationship
ColumnSchema.virtual('tasks', {
  ref: 'Task',           
  localField: '_id',     // Find tasks where `localField`
  foreignField: 'column_id', // is equal to `foreignField`
  options: { sort: { order: 1 } } // Default sort by order
});

ColumnSchema.index({ board_id: 1 });

export default mongoose.model<IColumnDocument>("Column", ColumnSchema)
