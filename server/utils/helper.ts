export const cleanPhoneNumber = (phoneNumber: string) => {
  return phoneNumber.replace("whatsapp:", "");
};

export function extractJsonFromOllamaResponse(ollamaResponse: any): {
  amount: number;
  description: string;
} {
  try {
    const jsonMatch = ollamaResponse.match(/\{.*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    // Parse the JSON string
    const parsedJson = JSON.parse(jsonMatch[0]);

    // Validate the required fields
    if (!parsedJson.amount || !parsedJson.description) {
      throw new Error("Invalid JSON structure");
    }

    return {
      amount: Number(parsedJson.amount),
      description: parsedJson.description,
    };
  } catch (error) {
    console.error("Error parsing Ollama response:", error);
    throw error;
  }
}
