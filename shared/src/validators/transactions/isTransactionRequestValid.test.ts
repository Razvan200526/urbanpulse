import { describe, expect, test } from "bun:test";
import { isResourceReviewReqValid } from "./isTransactionRequestValid";

describe("isResourceReviewReqValid", () => {
	test("accepts a rating and normalized optional comment", () => {
		const result = isResourceReviewReqValid({
			rating: 5,
			comment: "  Great   handoff.  ",
		});

		expect(result.success).toBe(true);
		expect(result.data).toEqual({
			rating: 5,
			comment: "Great handoff.",
		});
	});

	test("converts empty comments to undefined", () => {
		const result = isResourceReviewReqValid({
			rating: 4,
			comment: "   ",
		});

		expect(result.success).toBe(true);
		expect(result.data).toEqual({
			rating: 4,
			comment: undefined,
		});
	});

	test("rejects missing and out-of-range ratings", () => {
		expect(isResourceReviewReqValid({ comment: "Useful" }).success).toBe(false);
		expect(isResourceReviewReqValid({ rating: 0 }).success).toBe(false);
		expect(isResourceReviewReqValid({ rating: 6 }).success).toBe(false);
	});

	test("rejects fractional ratings and unsafe comments", () => {
		expect(isResourceReviewReqValid({ rating: 4.5 }).success).toBe(false);
		expect(
			isResourceReviewReqValid({
				rating: 4,
				comment: "<script>alert('no')</script>",
			}).success,
		).toBe(false);
	});
});
