import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Modal } from "./Modal";

describe("Modal", () => {
	test("renders trigger content from a render function", () => {
		let openHandlerType = "missing";

		const markup = renderToStaticMarkup(
			<Modal
				trigger={(open) => {
					openHandlerType = typeof open;
					return <button type="button">Open Modal</button>;
				}}
			>
				<div>Body</div>
			</Modal>,
		);

		expect(openHandlerType).toBe("function");
		expect(markup).toContain("Open Modal");
	});

	test("renders dialog content when controlled open", () => {
		expect(() =>
			renderToStaticMarkup(
				<Modal
					isOpen={true}
					header={<span>Dialog Title</span>}
					footer={<span>Dialog Footer</span>}
				>
					<div>Dialog Body</div>
				</Modal>,
			),
		).not.toThrow();
	});
});
