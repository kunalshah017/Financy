import { User } from "../models/User.model";

const getFriendsPhoneNumbers = async (
  user: any,
  names: string[]
): Promise<string[]> => {
  try {
    // Convert names to lowercase for case-insensitive comparison
    const lowerNames = names.map((name) => name.toLowerCase());

    // Find user and get their friends
    const userData = await User.findOne({ phoneNumber: user.phoneNumber });

    if (!userData || !userData.friends) {
      return [];
    }

    // Filter friends whose names match and map to phone numbers
    const matchingPhoneNumbers = userData.friends
      .filter((friend) => lowerNames.includes(friend.name.toLowerCase()))
      .map((friend) => friend.phoneNumber);

    return matchingPhoneNumbers;
  } catch (error) {
    console.error("Error getting friends' phone numbers:", error);
    return [];
  }
};

export { getFriendsPhoneNumbers };
