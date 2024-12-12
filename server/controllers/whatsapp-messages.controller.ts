import { type Context } from "hono";
import axios from "axios";
import ollama from "ollama";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const imageToBase64 = require("image-to-base64");

import client from "../config/twilio";
import { sendWhatsappMessage } from "../utils/whatsapp-messages";
import { User } from "../models/User.model";

import {
  cleanPhoneNumber,
  extractJsonFromOllamaResponse,
} from "../utils/helper";
import { getFunctionCall } from "../utils/ollama-prompts";

import {
  updateUpiId,
  addFriend,
  addExpense,
  addSaving,
} from "../utils/db-mutation";

import { getFriendsPhoneNumbers } from "../utils/db-query";

// Text Messages are handled here

const handleTextMessage = async (
  c: Context,
  user: any,
  From: any,
  Body: any
) => {
  const { callFunction, parameters, normalResponse } = await getFunctionCall(
    Body
  );

  if (!callFunction || !parameters) {
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
        Array.isArray(parameters[1]) ? parameters[1].join(", ") : parameters[1]
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
      `Payment requests of ₹${amount} each sent to ${parameters[1].join(", ")}`
    );

    return c.json({ success: true });
  }

  return c.json({ success: true });
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
      "Sorry, I had trouble processing that image. Please make sure it's a clear photo of a receipt or bill."
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

const generateReply = async (c: Context) => {
  const body = await c.req.parseBody();

  console.log("body", body);

  const { Body, From, ProfileName, MessageType, MediaContentType0, MediaUrl0 } =
    body as {
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

  return c.json({ success: true });
};

export { generateReply };
