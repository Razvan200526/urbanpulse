import * as z from "zod";

const disallowedMarkupRegex = /[<>]/;

const containsUnsupportedControlCharacters = (value: string) =>
	Array.from(value).some((char) => {
		const codePoint = char.codePointAt(0);

		if (codePoint === undefined) {
			return false;
		}

		return (
			(codePoint >= 0x0 && codePoint <= 0x8) ||
			codePoint === 0xb ||
			codePoint === 0xc ||
			(codePoint >= 0xe && codePoint <= 0x1f) ||
			codePoint === 0x7f
		);
	});

export const normalizePlainText = (value: string) =>
	value.replace(/\s+/g, " ").trim();

export const createSafePlainTextSchema = (
	min: number,
	max: number,
	options?: {
		allowEmpty?: boolean;
	},
) =>
	z
		.string()
		.transform(normalizePlainText)
		.refine(
			(value) =>
				(options?.allowEmpty && value.length === 0) ||
				(value.length >= min && value.length <= max),
			{
				message: `Text must be between ${min} and ${max} characters`,
			},
		)
		.refine((value) => !disallowedMarkupRegex.test(value), {
			message: "Text cannot contain markup characters",
		})
		.refine((value) => !containsUnsupportedControlCharacters(value), {
			message: "Text contains unsupported characters",
		});
