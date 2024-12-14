// src/models/User.model.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    upiId: {
      type: String,
      trim: true,
    },
    solanaWallet: {
      publicAddress: {
        type: String,
        trim: true,
      },
      secretKey: {
        type: String,
        trim: true,
      },
      recoveryPhrase: {
        type: String,
        trim: true,
      },
      balance: {
        type: Number,
        trim: true,
      },
      transactions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SolanaTransaction",
        },
      ],
    },
    expenses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
      },
    ],
    savings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Saving",
      },
    ],
    friends: [
      {
        name: {
          type: String,
          required: [true, "Name is required"],
          trim: true,
        },
        phoneNumber: {
          type: String,
          required: [true, "Phone number is required"],
          unique: true,
          trim: true,
        },
        upiId: {
          type: String,
          required: [true, "UPI ID is required"],
          unique: true,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
