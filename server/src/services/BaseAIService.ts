import { GoogleGenAI } from "@google/genai";
import { logger } from "@server/utils/Logger";

export abstract class BaseAIService {
	protected readonly model = "gemini-3.1-pro-preview";
	private client: GoogleGenAI | null | undefined;

	protected getClient(): GoogleGenAI | null {
		if (this.client !== undefined) {
			return this.client;
		}

		const apiKey = Bun.env.GEMINI_API_KEY?.trim();
		if (!apiKey) {
			this.client = null;
			return this.client;
		}

		this.client = new GoogleGenAI({ apiKey });
		return this.client;
	}

	protected async generateJson<T>(prompt: string): Promise<T | null> {
		const client = this.getClient();
		if (!client) return null;

		try {
			const response = await client.models.generateContent({
				model: this.model,
				contents: [{ role: "user", parts: [{ text: prompt }] }],
				config: {
					responseMimeType: "application/json",
					maxOutputTokens: 2048,
				},
			});

			const rawText = response.text?.trim();
			if (!rawText) return null;

			const cleanText = rawText.replace(/^```json\n?|```$/g, "").trim();
			return JSON.parse(cleanText) as T;
		} catch (error) {
			logger.error(`${error}`);
			return null;
		}
	}
}
