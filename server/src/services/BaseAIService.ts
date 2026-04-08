import { GoogleGenAI } from "@google/genai";
import { logger } from "@server/utils/Logger";

export abstract class BaseAIService {
	protected readonly model = "gemini-2.5-flash";
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

		this.client = new GoogleGenAI({
			apiKey,
		});
		return this.client;
	}

	protected async generateJson<T>(prompt: string): Promise<T | null> {
		logger.info(`Generating JSON with prompt: ${prompt}`);
		const client = this.getClient();
		if (!client) {
			return null;
		}

		try {
			const response = await client.models.generateContent({
				model: this.model,
				contents: prompt,
				config: {
					responseMimeType: "application/json",
				},
			});

			const text = response.text?.trim();
			if (!text) {
				return null;
			}

			return JSON.parse(text) as T;
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("AI JSON generation failed"),
			);
			return null;
		}
	}
}
