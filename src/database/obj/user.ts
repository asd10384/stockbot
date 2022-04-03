import "dotenv/config";
import { Document, model, Schema } from "mongoose";

export interface user_type extends Document {
  id: string;
  tag: string;
  nickname: string;
  money: number;
  getmoney: {
    check: boolean;
    time: string;
  };
  stocks: string;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true },
  tag: { type: String, required: true },
  nickname: { type: String, default: "" },
  getmoney: {
    check: { type: Boolean, default: false },
    time: { type: String, default: "" }
  },
  money: { type: Number, default: 0 },
  stocks: { type: String, default: "[]" }
});

export const user_model = model<user_type>(`User`, UserSchema);