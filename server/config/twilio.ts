import { Twilio } from "twilio";

const client = new Twilio(
  Bun.env.TWILIO_ACCOUNT_SID!,
  Bun.env.TWILIO_AUTH_TOKEN!
);

export default client;
