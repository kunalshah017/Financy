import { type Context } from "hono";
import axios from "axios";
import ollama from "ollama";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const imageToBase64 = require("image-to-base64");

import client from "../config/twilio";
import { User } from "../models/User.model";

import {
  cleanPhoneNumber,
  extractJsonFromOllamaResponse,
} from "../utils/helper";
import { sendWhatsappMessage } from "../utils/whatsapp-messages";
import { getFunctionCall } from "../utils/ollama-prompts";

import {
  updateUpiId,
  addFriend,
  addExpense,
  addSaving,
  updateSolanaWallet,
} from "../utils/db-mutation";
import { getFriendsPhoneNumbers } from "../utils/db-query";
import {
  createSolanaWallet,
  getSolanaBalance,
  sendSolanaTransaction,
} from "../utils/solana-functions";

// Text Messages are handled here

const handleTextMessage = async (
  c: Context,
  user: any,
  From: any,
  Body: any
) => {
  try {
    const { callFunction, parameters, normalResponse } = await getFunctionCall(
      Body
    );

    if (callFunction === "" && parameters.length === 0) {
      sendWhatsappMessage(
        cleanPhoneNumber(From),
        `${normalResponse}\n\nWant to know more about what Financy can do?\nSend  *help*  to know more`
      );
      return c.json({ success: true });
    }

    if (callFunction === "updateUpiId") {
      await updateUpiId(user, parameters[0]);
      sendWhatsappMessage(
        cleanPhoneNumber(From),
        `Your UPI ID has been updated to ${parameters[0]}`
      );
      return c.json({ success: true });
    }

    if (callFunction === "addFriend") {
      await addFriend(user, parameters[0], parameters[1]);
      sendWhatsappMessage(
        cleanPhoneNumber(From),
        `Added ${parameters[0]} to your friends list! 👥`
      );
      return c.json({ success: true });
    }

    if (callFunction === "addExpense") {
      await addExpense(user, Number(parameters[0]), parameters[1]);

      if (normalResponse) {
        sendWhatsappMessage(
          cleanPhoneNumber(From),
          `${normalResponse}\n\nAdded ${parameters[0]} to your expenses list! 💸\nReason: ${parameters[1]}`
        );
      } else {
        sendWhatsappMessage(
          cleanPhoneNumber(From),
          `Added ${parameters[0]} to your expenses list! 💸\nReason: ${parameters[1]}`
        );
      }

      return c.json({ success: true });
    }

    if (callFunction === "addSaving") {
      await addSaving(user, Number(parameters[0]), parameters[1]);
      if (normalResponse) {
        sendWhatsappMessage(
          cleanPhoneNumber(From),
          `${normalResponse}\n\nAdded ${parameters[0]} to your savings list! 💰✨\nReason: ${parameters[1]}`
        );
      } else {
        sendWhatsappMessage(
          cleanPhoneNumber(From),
          `Added ${parameters[0]} to your savings list! 💰✨\nReason: ${parameters[1]}`
        );
      }
      return c.json({ success: true });
    }
    if (callFunction === "splitExpense") {
      const friendsPhoneNumbers = await getFriendsPhoneNumbers(
        user,
        parameters[1]
      );

      const amount = Number(Number(parameters[0]) / (parameters[1].length + 1));

      // Get user's UPI ID
      const userUpiId = user.upiId;
      if (!userUpiId) {
        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          "Please set your UPI ID first using 'add upi <UPI ID>' command"
        );
        return c.json({ success: true });
      }

      //  deduct amount from user's balance
      await addExpense(
        user,
        amount,
        `split with friend${parameters[1].length > 1 ? "s" : ""}: ${
          Array.isArray(parameters[1])
            ? parameters[1].join(", ")
            : parameters[1]
        }`
      );

      // Generate UPI payment link
      const upiLink = `upi://pay?pa=${userUpiId}&am=${amount}&cu=INR`;

      // Generate QR code using QR Server API
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        upiLink
      )}`;

      console.log(friendsPhoneNumbers);
      // Send message to each friend
      for (const friendPhone of friendsPhoneNumbers) {
        console.log(friendPhone);

        // Send QR code image
        await client.messages.create({
          mediaUrl: [qrImageUrl],
          body: "Scan this QR code to pay",
          from: `whatsapp:${Bun.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${friendPhone}`,
        });

        await sendWhatsappMessage(
          friendPhone,
          `Hey! You need to pay ₹${amount} to ${user.name}\n\nUPI ID: ${userUpiId}\nPayment Link: ${upiLink}`
        );
      }

      // Send confirmation to user
      await sendWhatsappMessage(
        cleanPhoneNumber(From),
        `Payment requests of ₹${amount} each sent to ${parameters[1].join(
          ", "
        )}`
      );

      return c.json({ success: true });
    }

    if (callFunction === "createSolanaWallet") {
      try {
        const currentUser = await User.findOne({
          phoneNumber: cleanPhoneNumber(From),
        }).select("+solanaWallet");

        if (!currentUser) {
          throw new Error("User not found");
        }

        if (
          currentUser.solanaWallet &&
          currentUser.solanaWallet.publicAddress &&
          currentUser.solanaWallet.secretKey
        ) {
          await sendWhatsappMessage(
            cleanPhoneNumber(From),
            "*Security Alert*: You already have an active Solana wallet! " +
              "\nask Financy to provide your solana wallet details"
          );
          return c.json({ success: true });
        }

        const wallet = createSolanaWallet();
        await updateSolanaWallet(
          currentUser,
          wallet.secretKey,
          wallet.publicKey,
          String(wallet.mnemonic)
        );

        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          `Here's your new Solana wallet! 🌟\n\n` +
            `Public Address:\n${wallet.publicKey}\n\n` +
            `⚠️ KEEP THESE PRIVATE & SECURE ⚠️\n\n` +
            `Secret Key:\n${wallet.secretKey}\n\n` +
            `Recovery Phrase:\n${wallet.mnemonic}\n` +
            `\n\nWelcome to DeFi World of Financy 🪙!`
        );

        return c.json({ success: true });
      } catch (error) {
        console.error("Wallet creation error:", error);
        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          "Sorry, there was an error creating your wallet. Please try again later."
        );
        return c.json({ success: false });
      }
    }

    if (callFunction === "getSolanaBalance") {
      if (!user.solanaWallet) {
        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          "Please create a Solana wallet by asking Financy to create one for you"
        );
        return c.json({ success: true });
      }

      const balance = await getSolanaBalance(user.solanaWallet.publicAddress);
      await sendWhatsappMessage(
        cleanPhoneNumber(From),
        `Your Solana wallet balance is ${balance} SOL 🪙`
      );

      return c.json({ success: true });
    }

    if (callFunction === "sendSolanaTransaction") {
      if (!user.solanaWallet) {
        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          "Please create a Solana wallet by asking Financy to create one for you"
        );
        return c.json({ success: true });
      }

      if (parameters.length !== 2) {
        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          "Please provide recipient public address and amount in SOL"
        );
        return c.json({ success: true });
      }

      const userBalance = await getSolanaBalance(
        user.solanaWallet.publicAddress
      );

      if (Number(parameters[1]) > userBalance) {
        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          `You don't have enough SOL to send ${parameters[1]} SOL. Your balance is ${userBalance} SOL 🪙`
        );
        return c.json({ success: true });
      }

      const result = await sendSolanaTransaction(
        user.solanaWallet.secretKey,
        parameters[0],
        Number(parameters[1])
      );

      const userBalanceAfter = await getSolanaBalance(
        user.solanaWallet.publicAddress
      );

      if (result.success) {
        await sendWhatsappMessage(cleanPhoneNumber(From), result.message);
        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          `Your balance after sending transaction is ${userBalanceAfter} SOL 🪙`
        );
      } else {
        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          `Sorry, I had trouble sending your transaction. Please try again.`
        );
      }

      return c.json({ success: true });
    }

    if (callFunction === "getWalletDetails") {
      if (!user.solanaWallet) {
        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          "Please create a Solana wallet by asking Financy to create one for you"
        );
        return c.json({ success: true });
      }

      await sendWhatsappMessage(
        cleanPhoneNumber(From),
        `Here's your Solana wallet details:\n\n` +
          `Public Address:\n${user.solanaWallet.publicAddress}\n\n` +
          `⚠️ KEEP THESE PRIVATE & SECURE ⚠️\n\n` +
          `Secret Key:\n${user.solanaWallet.secretKey}\n\n` +
          `Recovery Phrase:\n${user.solanaWallet.recoveryPhrase}`
      );

      return c.json({ success: true });
    }

    if (callFunction === "getWalletAddress") {
      if (!user.solanaWallet) {
        await sendWhatsappMessage(
          cleanPhoneNumber(From),
          "Please create a Solana wallet by asking Financy to create one for you"
        );
        return c.json({ success: true });
      }
      await sendWhatsappMessage(
        cleanPhoneNumber(From),
        `Here's your Solana wallet address:\n\n` +
          `\n${user.solanaWallet.publicAddress}\n\n` +
          `You can use this address to receive SOL from anyone.`
      );
      return c.json({ success: true });
    }
  } catch (error) {
    console.error("Error processing text message:", error);
    await sendWhatsappMessage(
      cleanPhoneNumber(From),
      "Sorry, I had trouble processing your message. Please try again."
    );
    return c.json({ success: true });
  }
};

//  ---------------------------------

//  VCards Contacts are Handled here

const handleContactMessage = async (
  c: Context,
  user: any,
  From: any,
  MediaUrl0: any
) => {
  try {
    const auth = Buffer.from(
      `${Bun.env.TWILIO_ACCOUNT_SID}:${Bun.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const response = await axios.get(MediaUrl0, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const vCardContent = response.data;

    const nameLine = vCardContent
      .split("\n")
      .find((line: any) => line.startsWith("FN:"));
    const phoneLine = vCardContent
      .split("\n")
      .find((line: any) => line.startsWith("TEL;"));

    if (!nameLine || !phoneLine) {
      throw new Error("Could not find contact details");
    }

    const name = nameLine.split(":")[1].trim();
    const phoneNumber = cleanPhoneNumber(
      phoneLine.split(":")[1].trim()
    ).replace(/\s+/g, "");

    await addFriend(user, name, phoneNumber);

    await sendWhatsappMessage(
      cleanPhoneNumber(From),
      `Added ${name} to your friends list! 👥`
    );

    return c.json({ success: true });
  } catch (error) {
    console.error("Error processing contact:", error);
    await sendWhatsappMessage(
      cleanPhoneNumber(From),
      "Sorry, I had trouble adding this contact. Please try again."
    );
    return c.json({ success: true });
  }
};

//  ---------------------------------

// Image Messages are handled here

const handleImageMessage = async (
  c: Context,
  user: any,
  From: any,
  MediaUrl0: any
) => {
  let tempFilePath = "";

  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), "temp");
    await fs.mkdir(tempDir, { recursive: true });

    // Generate unique filename
    tempFilePath = path.join(tempDir, `${uuidv4()}.jpg`);

    // 1. Get image from Twilio URL
    const auth = Buffer.from(
      `${Bun.env.TWILIO_ACCOUNT_SID}:${Bun.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    // First fetch to get redirected URL
    console.log("Fetching initial URL:", MediaUrl0);
    const initialResponse = await fetch(MediaUrl0, {
      headers: { Authorization: `Basic ${auth}` },
      redirect: "follow",
    });

    if (!initialResponse.ok) {
      throw new Error(`Initial fetch failed: ${initialResponse.status}`);
    }

    // Get actual image URL and fetch content
    const actualImageUrl = initialResponse.url;
    console.log("Fetching actual image from:", actualImageUrl);
    const imageResponse = await fetch(actualImageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Image fetch failed: ${imageResponse.status}`);
    }

    // Save image to temp file
    const arrayBuffer = await imageResponse.arrayBuffer();
    await fs.writeFile(tempFilePath, new Uint8Array(arrayBuffer));
    console.log("Image saved to:", tempFilePath);

    let base64 = "";

    imageToBase64(tempFilePath) // Path to the image
      .then((response: any) => {
        base64 = response; // Logs the base64 string
      })
      .catch((error: any) => {
        console.log(error); // Logs an error if there was one
      });

    const ollamaResponse = await ollama.chat({
      model: "llama3.2-vision",
      messages: [
        {
          role: "user",
          content:
            "This is an expense receipt/bill. Tell me the total amount and give a short description (max 5 words) of what this expense is for. Reply in JSON format strictly only with keys 'amount' and 'description'. Extract only the final/total amount.",
          images: [tempFilePath],
        },
      ],
      stream: false,
    });

    console.log("Ollama response:", ollamaResponse.message.content);
    const parsedResponse = extractJsonFromOllamaResponse(
      ollamaResponse.message.content
    );
    console.log("Parsed response:", parsedResponse);

    await addExpense(
      user,
      Number(parsedResponse.amount),
      parsedResponse.description
    );

    await sendWhatsappMessage(
      cleanPhoneNumber(From),
      `Added ₹${parsedResponse.amount} to your expenses list! 💸\nReason: ${parsedResponse.description}`
    );

    return c.json({ success: true });
  } catch (error) {
    console.error("Detailed error:", error);
    await sendWhatsappMessage(
      cleanPhoneNumber(From),
      "Sorry, I had trouble processing that image. Please make sure it's a clear photo of a receipt or bill and try again."
    );
    return c.json({ success: true });
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log("Temp file deleted:", tempFilePath);
      } catch (error) {
        console.error("Error deleting temp file:", error);
      }
    }
  }
};

//  ---------------------------------

// Voice Messages are handled here

const handleVoiceMessage = async (
  c: Context,
  user: any,
  From: any,
  MediaUrl0: any
) => {
  let tempAudioPath = "";

  try {
    // Create temp directory
    const tempDir = path.join(process.cwd(), "server", "temp");
    await fs.mkdir(tempDir, { recursive: true });

    // Generate temp file path
    tempAudioPath = path.resolve(tempDir, `${uuidv4()}.ogg`);

    // Download audio file
    const auth = Buffer.from(
      `${Bun.env.TWILIO_ACCOUNT_SID}:${Bun.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const initialResponse = await fetch(MediaUrl0, {
      headers: { Authorization: `Basic ${auth}` },
      redirect: "follow",
    });

    if (!initialResponse.ok) {
      throw new Error(`Initial fetch failed: ${initialResponse.status}`);
    }

    const actualAudioUrl = initialResponse.url;
    const audioResponse = await fetch(actualAudioUrl);

    if (!audioResponse.ok) {
      throw new Error(`Audio fetch failed: ${audioResponse.status}`);
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    await fs.writeFile(tempAudioPath, new Uint8Array(arrayBuffer));

    // Create form data for Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([await fs.readFile(tempAudioPath)]);
    formData.append("audio_file", audioBlob, "audio.ogg");

    // Call Whisper API service
    const whisperResponse = await fetch(
      "http://localhost:9000/asr?output=json",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!whisperResponse.ok) {
      throw new Error("Failed to transcribe audio");
    }

    const result = await whisperResponse.json();
    const transcribedText = result.text;

    console.log("Transcribed text:", transcribedText);

    if (transcribedText) {
      await handleTextMessage(c, user, From, transcribedText);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error processing voice message:", error);
    await sendWhatsappMessage(
      cleanPhoneNumber(From),
      "Sorry, I had trouble processing your voice message. Please try again."
    );
    return c.json({ success: true });
  } finally {
    // Clean up temp file
    if (tempAudioPath && (await fs.exists(tempAudioPath))) {
      try {
        await fs.unlink(tempAudioPath);
        console.log("Temp file deleted:", tempAudioPath);
      } catch (error) {
        console.error("Error deleting temp file:", error);
      }
    }
  }
};

//  ---------------------------------

const generateReply = async (c: Context) => {
  const body = await c.req.parseBody();

  console.log("body", body);

  const { Body, From, ProfileName, MessageType, MediaUrl0 } = body as {
    Body: any;
    From: any;
    ProfileName: any;
    MessageType: any;
    MediaContentType0: any;
    MediaUrl0: any;
  };

  console.log(
    `Received message from ${cleanPhoneNumber(
      From
    )}: ${Body}, type: ${MessageType}`
  );

  const user = await User.findOne({ phoneNumber: cleanPhoneNumber(From) });

  if (!user) {
    await User.create({
      name: ProfileName,
      phoneNumber: cleanPhoneNumber(From),
    });

    console.log(`User ${ProfileName} created, phone number: ${From}`);

    sendWhatsappMessage(
      cleanPhoneNumber(From),
      `Hello ${ProfileName}, Welcome to Financy!\nGlad to have you here 😃\n\nYou can add your UPI ID by sending\nadd upi <UPI ID>`
    );
    return c.json({ success: true });
  }

  if (MessageType === "text") {
    await handleTextMessage(c, user, From, Body);
  }

  if (MessageType === "contacts") {
    await handleContactMessage(c, user, From, MediaUrl0);
  }

  if (MessageType === "image") {
    await handleImageMessage(c, user, From, MediaUrl0);
  }

  if (MessageType === "audio") {
    await handleVoiceMessage(c, user, From, MediaUrl0);
  }

  return c.json({ success: true });
};

export { generateReply };
