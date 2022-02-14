import { config } from "dotenv";
import { Document, model, Schema } from "mongoose";
config();

export interface user_type extends Document {
  id: string;
  tag: string;
  nickname: string;
  money: number;
  getmoney: {
    check: boolean;
    time: string;
  };
  stocks: {
    code: string;
    name: string;
    price: number;
    count: number;
  }[]
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
  stocks: { type: Array, default: [] }
});

export const user_model = model<user_type>(`User`, UserSchema);