import { BaseAIService } from "./BaseAIService";

type MatchInferenceResult = {
	tags: string[];
	provider: "gemini" | "keyword";
	model: string | null;
	matchedKeywords: string[];
	rawSuggestedTags?: string[];
};

const STOP_WORDS = new Set([
	"and",
	"assist",
	"assistance",
	"basic",
	"for",
	"help",
	"my",
	"need",
	"needed",
	"needs",
	"of",
	"please",
	"service",
	"services",
	"skill",
	"skills",
	"some",
	"support",
	"the",
	"to",
	"with",
]);

const TOKEN_SYNONYMS: Record<string, string> = {
	auto: "car",
	automobile: "car",
	automotive: "car",
	cars: "car",
	diagnose: "diagnostic",
	diagnosed: "diagnostic",
	diagnoses: "diagnostic",
	diagnosing: "diagnostic",
	diagnosis: "diagnostic",
	diagnostics: "diagnostic",
	fixed: "repair",
	fixes: "repair",
	fixing: "repair",
	jump: "jumpstart",
	"jump-start": "jumpstart",
	jumpstarting: "jumpstart",
	mechanics: "mechanic",
	motor: "engine",
	repairing: "repair",
	repairs: "repair",
	starting: "start",
	tires: "tire",
	tyre: "tire",
	tyres: "tire",
	vehicle: "car",
	vehicles: "car",
	wont: "stopped",
};

const KEYWORD_RULES: Record<string, string[]> = {
	"first-aid": [
		"first aid",
		"medical",
		"injury",
		"bleeding",
		"ambulance",
		"paramedic",
	],
	transport: ["transport", "ride", "pickup", "drop off", "drive", "clinic"],
	logistics: ["move", "moving", "carry", "couch", "heavy", "lifting"],
	coordination: ["coordinate", "coordination", "organize", "organise", "help"],
	communications: ["phone", "signal", "contact", "communicate", "message"],
	childcare: ["child", "children", "babysit", "babysitting"],
	"pet-care": ["pet", "dog", "cat", "animal"],
	electrical: ["electrical", "power", "wiring", "electricity"],
	"generator-repair": ["generator", "outage", "repair"],
	"community-support": ["check-in", "elderly", "support", "wellness"],
	"physical-help": ["physical help", "manual labor", "manual labour"],
	lifting: ["lifting", "lift", "carry", "heavy"],
	mechanic: [
		"mechanic",
		"auto repair",
		"car repair",
		"vehicle repair",
		"won't start",
		"wont start",
	],
	"car-fixing": [
		"car fix",
		"fix my car",
		"fix the car",
		"car repair",
		"vehicle repair",
	],
	"car-repair": [
		"car repair",
		"auto repair",
		"vehicle repair",
		"engine trouble",
		"car trouble",
	],
	"car-diagnostics": [
		"diagnostic",
		"diagnostics",
		"check engine",
		"engine problem",
	],
	"car-battery-jumpstart": [
		"battery",
		"jumpstart",
		"jump start",
		"dead battery",
	],
	"flat-tire-change": ["flat tire", "flat tyre", "tire change", "tyre change"],
};

const SEMANTIC_RULES: Array<{ patterns: string[]; tokens: string[] }> = [
	{
		patterns: [
			"mechanic",
			"car",
			"vehicle",
			"automotive",
			"engine",
			"battery",
			"jumpstart",
			"jump start",
			"flat tire",
			"flat tyre",
			"won't start",
			"wont start",
			"stopped",
		],
		tokens: [
			"battery",
			"car",
			"diagnostic",
			"engine",
			"jumpstart",
			"mechanic",
			"repair",
			"stopped",
			"tire",
		],
	},
];

export function normalizeSkillTag(tag: string) {
	return tag
		.trim()
		.toLowerCase()
		.replace(/[_\s]+/g, "-")
		.replace(/-+/g, "-");
}

function unique(values: string[]) {
	return Array.from(new Set(values));
}

function stemToken(token: string) {
	if (token.length > 5 && token.endsWith("ing")) {
		return token.slice(0, -3);
	}
	if (token.length > 4 && token.endsWith("ed")) {
		return token.slice(0, -2);
	}
	if (token.length > 4 && token.endsWith("es")) {
		return token.slice(0, -2);
	}
	if (token.length > 3 && token.endsWith("s")) {
		return token.slice(0, -1);
	}
	return token;
}

function canonicalizeToken(rawToken: string) {
	const trimmed = rawToken.trim().toLowerCase();
	if (!trimmed) {
		return null;
	}

	const normalized = TOKEN_SYNONYMS[trimmed] ?? stemToken(trimmed);
	const canonical = TOKEN_SYNONYMS[normalized] ?? normalized;

	if (!canonical || STOP_WORDS.has(canonical)) {
		return null;
	}

	return canonical;
}

function tokenizeForMatching(value: string) {
	return unique(
		value
			.toLowerCase()
			.split(/[^a-z0-9]+/g)
			.map((token) => canonicalizeToken(token))
			.filter((token): token is string => Boolean(token)),
	);
}

export class RequestMatchingAIService extends BaseAIService {
	private keywordInfer(text: string, allowedTags: string[]) {
		const normalizedAllowed = new Set(allowedTags.map(normalizeSkillTag));
		const sourceTokens = new Set(tokenizeForMatching(text));
		const matchedKeywords = new Set<string>();
		const directMatches = new Set<string>();

		for (const tag of normalizedAllowed) {
			const candidate = tag.replace(/-/g, " ");
			if (text.includes(candidate)) {
				directMatches.add(tag);
				matchedKeywords.add(candidate);
			}

			const tagTokens = tokenizeForMatching(candidate);
			const overlappingTokens = tagTokens.filter((token) =>
				sourceTokens.has(token),
			);
			if (overlappingTokens.length > 0) {
				directMatches.add(tag);
				for (const token of overlappingTokens) {
					matchedKeywords.add(token);
				}
			}
		}

		for (const [tag, patterns] of Object.entries(KEYWORD_RULES)) {
			const normalizedTag = normalizeSkillTag(tag);
			if (!normalizedAllowed.has(normalizedTag)) {
				continue;
			}

			for (const pattern of patterns) {
				if (text.includes(pattern)) {
					directMatches.add(normalizedTag);
					matchedKeywords.add(pattern);
				}
			}
		}

		for (const rule of SEMANTIC_RULES) {
			const matchedPattern = rule.patterns.find((pattern) =>
				text.includes(pattern),
			);
			if (!matchedPattern) {
				continue;
			}

			for (const tag of normalizedAllowed) {
				const tagTokens = tokenizeForMatching(tag.replace(/-/g, " "));
				if (tagTokens.some((token) => rule.tokens.includes(token))) {
					directMatches.add(tag);
					matchedKeywords.add(matchedPattern);
				}
			}
		}

		return {
			tags: Array.from(directMatches),
			matchedKeywords: Array.from(matchedKeywords),
		};
	}

	async inferSkillTags(params: {
		title: string;
		description?: string | null;
		allowedTags: string[];
	}): Promise<MatchInferenceResult> {
		const normalizedAllowed = unique(
			params.allowedTags.map(normalizeSkillTag).filter(Boolean),
		);
		const sourceText = `${params.title}\n${params.description ?? ""}`
			.toLowerCase()
			.trim();
		const keywordResult = this.keywordInfer(sourceText, normalizedAllowed);

		if (!sourceText || normalizedAllowed.length === 0) {
			return {
				tags: keywordResult.tags,
				provider: "keyword",
				model: null,
				matchedKeywords: keywordResult.matchedKeywords,
			};
		}

		const response = await this.generateJson<{ tags?: string[] }>(
			[
				"You classify neighborhood help requests into an existing controlled tag list.",
				'Return strict JSON only in the form {"tags": string[]}.',
				"Choose only tags from the allowed list.",
				"Prefer at most 5 tags and omit weak guesses.",
				`Allowed tags: ${normalizedAllowed.join(", ")}`,
				`Request title: ${params.title}`,
				`Request description: ${params.description ?? ""}`,
			].join("\n"),
		);

		const aiTags = unique(
			(response?.tags ?? [])
				.map((tag) => normalizeSkillTag(String(tag)))
				.filter((tag) => normalizedAllowed.includes(tag)),
		);

		const tags = aiTags.length > 0 ? aiTags : keywordResult.tags;

		return {
			tags,
			provider: aiTags.length > 0 ? "gemini" : "keyword",
			model: aiTags.length > 0 ? this.model : null,
			matchedKeywords: keywordResult.matchedKeywords,
			rawSuggestedTags: aiTags.length > 0 ? aiTags : undefined,
		};
	}
}

export const requestMatchingAIService = new RequestMatchingAIService();
