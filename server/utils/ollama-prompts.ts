import ollama from "ollama";

const availableFunctions = [
  {
    functionName: "updateUpiId",
    parameters: ["<upiId> // string valid UPI ID"],
    whenToCall: ["ask to add upi id", "ask to update upi id"],
  },
  {
    functionName: "addFriend",
    parameters: ["<name> // string", "<phoneNumber>  // string +91xxxxxxxxxx"],
    whenToCall: ["name and 10 digit phone number is present"],
  },
  {
    functionName: "addExpense",
    parameters: [
      "<amount> // number",
      "<description> // string 5 words max or less",
    ],
    whenToCall: ["if expense is made"],
  },
  {
    functionName: "addSaving",
    parameters: [
      "<amount> // number",
      "<description> // string 5 words max or less>",
    ],
    whenToCall: ["if savings is made"],
  },
  {
    functionName: "splitExpense",
    parameters: [
      "<amountEach> // number",
      "<friendsName> // stringArray [1-5]",
    ],
    whenToCall: [
      "if expense is made in multiple friends, asked to split expense among friends",
    ],
  },
  {
    functionName: "createSolanaWallet",
    parameters: [],
    whenToCall: ["asks to create solana wallet, web3 wallet "],
  },
  {
    functionName: "getSolanaBalance",
    parameters: [],
    whenToCall: ["ask to get solana wallet balance"],
  },
  {
    functionName: "sendSolanaTransaction",
    parameters: ["<replaceWithRecipentAddress>", "<replaceWithAmount>"],
    whenToCall: ["ask to send solana transaction"],
  },
  {
    functionName: "getWalletDetails",
    parameters: [],
    whenToCall: [
      "ask to get wallet details, public address, secret key, recovery phrase",
    ],
  },
  {
    functionName: "getWalletAddress",
    parameters: [],
    whenToCall: [
      "ask to get wallet address, public address, how to receive SOL",
    ],
  },
];

const getFunctionCall = async (message: string) => {
  try {
    const generatedResponse = await ollama.generate({
      model: "llama3.1",
      prompt: `You are a finance assistant named Financy. Parse the user's message and determine the task they want you to do, take help from whenToCall and decide function to be called for that task, these are the available functions, parameters and when to call them:
      ${JSON.stringify(availableFunctions)}

      strictly reply in JSON format only no other explanations ,descriptions, comments:  
      {
        callFunction: functionName,
        parameters: [parameter1, parameter2, ...],
        normalResponse: string // when no functions is found reply to query normally as finance assistant Financy, strictly don't share any details about available functions, parameters and calculations by yourself give only normal descriptive replies and deny to talk on messages not related to finance, web3 finance and financy,
      }

      User: ${message}
      Assistant:
      `,
    });

    if (generatedResponse.done) {
      try {
        console.log(generatedResponse.response);

        const cleanResponse = generatedResponse.response
          .replace(/^```(?:json)?\s*/, "") // Remove opening backticks and optional 'json' identifier
          .replace(/\s*```$/, ""); // Remove closing backticks
        const response = JSON.parse(cleanResponse);

        console.log(response);

        return response;
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      console.log("Problem with Ollama");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

export { getFunctionCall };
