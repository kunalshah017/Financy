export interface IUser {
  name: string;
  phoneNumber: string;
  upiId: string;
  expenses: ITransaction[];
  savings: ITransaction[];
  friends: IFriend[];
}

export interface IFriend {
  name: string; 
  phoneNumber: string;
  upiId: string;
}

export interface ITransaction {
  amount: number;
  description?: string;
  date: Date;
}
