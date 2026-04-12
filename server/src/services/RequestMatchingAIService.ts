type MatchInferenceResult = {
	tags: string[];
	provider: "keyword";
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
	coordination: ["coordinate", "coordination", "organize", "organise"],
	communications: ["phone", "signal", "contact", "communicate", "message"],
	childcare: ["child", "children", "babysit", "babysitting"],
	"pet-care": ["pet", "dog", "cat", "animal"],
	electrical: ["electrical", "power", "wiring", "electricity"],
	"generator-repair": ["generator", "outage", "repair"],
	"community-support": ["check-in", "elderly", "wellness", "safe"],
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

type ScoredTag = {
	score: number;
	matchedKeywords: Set<string>;
};

function addTagScore(
	scoredTags: Map<string, ScoredTag>,
	tag: string,
	score: number,
	keywords: string[],
) {
	const existing = scoredTags.get(tag) ?? {
		score: 0,
		matchedKeywords: new Set<string>(),
	};
	existing.score += score;
	for (const keyword of keywords) {
		existing.matchedKeywords.add(keyword);
	}
	scoredTags.set(tag, existing);
}

export class RequestMatchingAIService {
	private keywordInfer(text: string, allowedTags: string[]) {
		const normalizedAllowed = new Set(allowedTags.map(normalizeSkillTag));
		const sourceTokens = new Set(tokenizeForMatching(text));
		const scoredTags = new Map<string, ScoredTag>();

		for (const tag of normalizedAllowed) {
			const candidate = tag.replace(/-/g, " ");
			if (text.includes(candidate)) {
				addTagScore(scoredTags, tag, 4, [candidate]);
			}

			const tagTokens = tokenizeForMatching(candidate);
			const overlappingTokens = tagTokens.filter((token) =>
				sourceTokens.has(token),
			);
			if (overlappingTokens.length > 0) {
				const overlapBonus =
					overlappingTokens.length === tagTokens.length ? 2 : 0;
				addTagScore(
					scoredTags,
					tag,
					overlappingTokens.length + overlapBonus,
					overlappingTokens,
				);
			}
		}

		for (const [tag, patterns] of Object.entries(KEYWORD_RULES)) {
			const normalizedTag = normalizeSkillTag(tag);
			if (!normalizedAllowed.has(normalizedTag)) {
				continue;
			}

			for (const pattern of patterns) {
				if (text.includes(pattern)) {
					addTagScore(scoredTags, normalizedTag, 4, [pattern]);
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
				const semanticOverlap = tagTokens.filter((token) =>
					rule.tokens.includes(token),
				);
				if (semanticOverlap.length > 0) {
					addTagScore(scoredTags, tag, semanticOverlap.length, [
						matchedPattern,
						...semanticOverlap,
					]);
				}
			}
		}

		const sortedMatches = Array.from(scoredTags.entries())
			.filter(([, data]) => data.score > 0)
			.sort((a, b) => {
				if (b[1].score !== a[1].score) {
					return b[1].score - a[1].score;
				}

				return a[0].localeCompare(b[0]);
			})
			.slice(0, 5);

		return {
			tags: sortedMatches.map(([tag]) => tag),
			matchedKeywords: unique(
				sortedMatches.flatMap(([, data]) => Array.from(data.matchedKeywords)),
			),
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

		return {
			tags:
				sourceText && normalizedAllowed.length > 0 ? keywordResult.tags : [],
			provider: "keyword",
			model: null,
			matchedKeywords: keywordResult.matchedKeywords,
		};
	}
}

export const requestMatchingAIService = new RequestMatchingAIService();
