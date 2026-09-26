import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface PermissionDocument extends Document {
  key: string;
  name: string;
  description: string;
}

const permissionSchema = new Schema<PermissionDocument>({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
});

export const PermissionCatalog: Model<PermissionDocument> =
  mongoose.models.PermissionCatalog ||
  mongoose.model<PermissionDocument>("PermissionCatalog", permissionSchema, "permissions");
