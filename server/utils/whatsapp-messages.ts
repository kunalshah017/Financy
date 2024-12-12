import client from "../config/twilio";

const sendWhatsappMessage = async (
  to: string | any,
  message: string,
  getStatus: boolean = false
) => {
  console.log("Sending message to", to);

  const response = await client.messages.create({
    body: message,
    from: `whatsapp:${Bun.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
  });

  if (getStatus) {
    return response.sid;
  }
};

export { sendWhatsappMessage };
