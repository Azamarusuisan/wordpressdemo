const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    try {
        const models = await genAI.listModels();
        console.log("Available Models:");
        models.models.forEach((m) => {
            console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(", ")})`);
        });
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

run();
