import { Hono } from "hono";
import { generateReply } from "../controllers/whatsapp-messages.controller";

const whatsappRoutes = new Hono();

whatsappRoutes.post("/receive-message", generateReply);

//  TODO: Use User message status when required

// whatsappRoutes.post("/message-status", async (c) => {
//   const body = await c.req.parseBody();
//   const { MessageSid, MessageStatus } = body;

//   console.log(`Message ${MessageSid} status: ${MessageStatus}`);

//   return c.json({ success: true });
// });

export default whatsappRoutes;
