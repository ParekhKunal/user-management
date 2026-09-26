import mongoose, { Schema, type Model } from "mongoose";

export interface CounterDocument {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDocument>({
  _id: { type: String },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter: Model<CounterDocument> =
  mongoose.models.Counter || mongoose.model<CounterDocument>("Counter", counterSchema);

export async function nextSequence(name: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

export function formatEmployeeCode(seq: number): string {
  return `EMP-${String(seq).padStart(6, "0")}`;
}
