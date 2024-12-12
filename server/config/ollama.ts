import ollama from "ollama";

const connectOllama = async () => {
  try {
    const generatedResponse = await ollama.generate({
      model: "llama3.1",
      prompt: "",
    });

    if (generatedResponse.done) {
      console.log("🤖 llama3.1 online & ready");
    } else {
      console.log("Problem with Ollama");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

export { connectOllama };
