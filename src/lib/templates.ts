import { RichDoc, RichNode } from "../types";

const text = (value: string, ...marks: string[]): RichNode => ({
  type: "text",
  text: value,
  ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
});
const paragraph = (...content: RichNode[]): RichNode => ({ type: "paragraph", content });
const bullets = (...items: RichNode[][]): RichNode => ({
  type: "bulletList",
  content: items.map((content) => ({ type: "listItem", content: [paragraph(...content)] })),
});

/** Starting text for a new quote's introduction; users edit it freely. */
export const quoteIntroTemplate = (): RichDoc => ({
  type: "doc",
  content: [
    paragraph(text("Thank you for the opportunity to quote for this work.")),
    paragraph(
      text("Below you'll find the proposed scope and pricing. Everything listed is included in the price; anything not listed can be quoted separately. Please get in touch if you'd like to adjust the scope.")
    ),
  ],
});

/** Starting terms for a new quote. */
export const quoteClosingTemplate = (): RichDoc => ({
  type: "doc",
  content: [
    paragraph(text("Terms & conditions", "bold")),
    bullets(
      [text("Payment: ", "bold"), text("50% deposit to begin, 50% on completion, due within 14 days of each invoice.")],
      [text("Timeline: ", "bold"), text("work starts within 5 working days of acceptance and deposit.")],
      [text("Changes: ", "bold"), text("changes to the agreed scope may be quoted separately.")],
      [text("Prices exclude third-party costs such as licences, hosting or stock assets unless listed above.", "italic")]
    ),
    paragraph(text("To accept this quote, please reply by email or sign and return a copy.")),
    paragraph(text("Accepted by (name, signature, date): ________________________________")),
  ],
});
