import ollama from "ollama";

const connectOllama = async () => {
  try {
    const generatedResponse = await ollama.generate({
      model: "calebfahlgren/natural-functions",
      prompt: "",
    });

    if (generatedResponse.done) {
      console.log("🤖 calebfahlgren/natural-functions online & ready");
    } else {
      console.log("Problem with Ollama");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

export { connectOllama };
