import mongoose from "mongoose";
import { type ITransaction } from "../types";

const expenseSchema = new mongoose.Schema<ITransaction>(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", expenseSchema);
