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
      unique: true,
      trim: true,
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
