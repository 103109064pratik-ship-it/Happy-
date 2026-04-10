
import fs from "fs";

async function listModels() {
    let apiKey = "";
    try {
        const env = fs.readFileSync(".env.local", "utf8");
        const lines = env.split("\n");
        for (const line of lines) {
            if (line.startsWith("GEMINI_API_KEY=")) {
                apiKey = line.split("=")[1].trim();
                break;
            }
        }
    } catch (err) {
        console.error("Error reading .env.local:", err);
        return;
    }

    if (!apiKey) {
        console.error("No GEMINI_API_KEY found in .env.local");
        return;
    }

    console.log(`Checking models for API key starting with: ${apiKey.substring(0, 8)}...`);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("AVAILABLE_MODELS_LIST_START");
            data.models.forEach((m) => {
                console.log(`MODEL: ${m.name}`);
            });
            console.log("AVAILABLE_MODELS_LIST_END");
        } else {
            console.log("No models returned. Response:", JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Error listing models via fetch:", err);
    }
}

listModels();
