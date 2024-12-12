import { User } from "../models/User.model";
import { Expense } from "../models/Expense.model";
import { Saving } from "../models/Saving.model";

const updateUpiId = async (user: any, upiId: string) => {
  await User.findOneAndUpdate(
    { phoneNumber: user.phoneNumber },
    {
      $set: {
        upiId: upiId,
      },
    }
  );
};

const addFriend = async (user: any, name: string, phoneNumber: string) => {
  await User.findOneAndUpdate(
    { phoneNumber: user.phoneNumber },
    {
      $push: {
        friends: {
          name: name.toLowerCase(),
          phoneNumber: phoneNumber,
        },
      },
    },
    { new: true }
  );
};

const addExpense = async (user: any, amount: number, description: string) => {
  const expense = await Expense.create({
    amount,
    description,
    date: new Date(),
  });

  await User.findOneAndUpdate(
    { phoneNumber: user.phoneNumber },
    {
      $push: {
        expenses: expense._id,
      },
    },
    { new: true }
  );
};

const addSaving = async (user: any, amount: number, description: string) => {
  const saving = await Saving.create({
    amount,
    description,
    date: new Date(),
  });

  await User.findOneAndUpdate(
    { phoneNumber: user.phoneNumber },
    {
      $push: {
        savings: saving._id,
      },
    },
    { new: true }
  );
};

export { updateUpiId, addFriend, addExpense, addSaving };
