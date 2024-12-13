import mongoose from "mongoose";

const solanaTransactionSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: [true, "To address is required"],
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const SolanaTransaction = mongoose.model(
  "SolanaTransaction",
  solanaTransactionSchema
);
