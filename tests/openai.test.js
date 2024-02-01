// Test for data prompt
const secrets = require("../secrets.js");
const OPENAI_KEY = secrets.OPENAI_KEY;
const dataPrompt = require("fs").readFileSync(__dirname + "/../dataPrompt.txt", "utf-8");
const openai = require("openai");
const openAiInstance = new openai({apiKey: OPENAI_KEY});

describe("OpenAI API", () => {
    it("should return response from ChatGPT", async () => {
        const currentPrompt = dataPrompt.replace("{{date}}", new Date().toLocaleString());
        const content = currentPrompt + " " + "Two fried eggs with a slice of buttered toast";

        const response = await openAiInstance.chat.completions.create({
            model: "gpt-4",
            messages: [{role: "user", content}],
        });

        const text = response.choices[0].message.content;
        const json = JSON.parse(text);

        const data = {
            name: "Two fried eggs with a slice of buttered toast",
            calories_low: 310,
            calories: 330,
            calories_high: 350,
            protein_low: 16,
            protein: 18,
            protein_high: 20,
            fat_low: 21,
            fat: 23,
            fat_high: 25,
            carbs_low: 15,
            carbs: 17,
            carbs_high: 19,
            consumed_at: "2024-01-31 22:47:39",
        };
        expect(Object.keys(json)).toEqual(Object.keys(data));
    }, 20000);
});
