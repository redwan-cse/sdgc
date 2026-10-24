import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "@/components/ui/markdown-content";

describe("MarkdownContent Component", () => {
  it("renders basic paragraphs and headings correctly", () => {
    const markdown = `# Main Title\n\n## Sub Title\n\n### Section Title\n\nThis is a standard paragraph.`;
    const html = renderToStaticMarkup(React.createElement(MarkdownContent, { content: markdown }));

    expect(html).toContain("<h1");
    expect(html).toContain("Main Title");
    expect(html).toContain("<h2");
    expect(html).toContain("Sub Title");
    expect(html).toContain("<h3");
    expect(html).toContain("Section Title");
    expect(html).toContain("<p");
    expect(html).toContain("This is a standard paragraph.");
  });

  it("formats inline bold, italic, and safe links", () => {
    const markdown = `Check **bold text** and *italic note* and [Club Site](https://saugatuckdouglasgardenclub.com).`;
    const html = renderToStaticMarkup(React.createElement(MarkdownContent, { content: markdown }));

    expect(html).toContain("<strong");
    expect(html).toContain("bold text");
    expect(html).toContain("<em");
    expect(html).toContain("italic note");
    expect(html).toContain('<a href="https://saugatuckdouglasgardenclub.com"');
    expect(html).toContain("Club Site");
  });

  it("filters out unsafe javascript: links", () => {
    const markdown = `Click [Malicious](javascript:alert('xss')) for fun.`;
    const html = renderToStaticMarkup(React.createElement(MarkdownContent, { content: markdown }));

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a href=");
    expect(html).toContain("Malicious");
  });

  it("filters out data: and protocol-relative // links", () => {
    const markdown = `Test [Data Link](data:text/html,<script>alert(1)</script>) and [Protocol Relative](//evil.com/hack).`;
    const html = renderToStaticMarkup(React.createElement(MarkdownContent, { content: markdown }));

    expect(html).not.toContain("data:text/html");
    expect(html).not.toContain("//evil.com");
    expect(html).toContain("Data Link");
    expect(html).toContain("Protocol Relative");
  });

  it("properly encodes relative link attributes and neutralizes attribute breakouts", () => {
    const markdown = `Visit [Contact Page](/contact" data-break="true).`;
    const html = renderToStaticMarkup(React.createElement(MarkdownContent, { content: markdown }));

    expect(html).toContain('href="/contact%22%20data-break=%22true"');
    expect(html).not.toContain('data-break="true"');
  });

  it("renders bulleted and numbered lists and blockquotes", () => {
    const markdown = `- Item 1\n- Item 2\n\n1. First\n2. Second\n\n> A thoughtful quotation.`;
    const html = renderToStaticMarkup(React.createElement(MarkdownContent, { content: markdown }));

    expect(html).toContain("<ul");
    expect(html).toContain("Item 1");
    expect(html).toContain("<ol");
    expect(html).toContain("First");
    expect(html).toContain("<blockquote");
    expect(html).toContain("A thoughtful quotation.");
  });

  it("returns null for empty content", () => {
    const html = renderToStaticMarkup(React.createElement(MarkdownContent, { content: "" }));
    expect(html).toBe("");
  });

  it("renders about page bylaws markdown with headings, bullet lists, and download links", () => {
    const aboutContent = `Organized in 1928, the Saugatuck Douglas Garden Club works continuously to beautify and enhance the communities of Saugatuck and Douglas.

### Club Bylaws & Governance

The Saugatuck Douglas Garden Club operates under standing bylaws adopted by the membership. Members and the community can review our official governing framework:

- [Download Official Club Bylaws (PDF)](https://res.cloudinary.com/p4wempwi/raw/upload/v1792818426/sdgc-web/archive/documents/BYLAWS-SDGC-FINAL.pdf)
- Member of the Michigan Garden Clubs, Inc. (District IV)
- Member of National Garden Clubs, Inc. (Central Region)
- General meetings: Third Monday of each month, April through November.`;

    const html = renderToStaticMarkup(
      React.createElement(MarkdownContent, { content: aboutContent }),
    );

    expect(html).toContain("<h3");
    expect(html).toContain("Club Bylaws &amp; Governance");
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).toContain("Download Official Club Bylaws (PDF)");
    expect(html).toContain(
      "https://res.cloudinary.com/p4wempwi/raw/upload/v1792818426/sdgc-web/archive/documents/BYLAWS-SDGC-FINAL.pdf",
    );
    expect(html).toContain("District IV");
    expect(html).not.toContain("### Club Bylaws");
    expect(html).not.toContain("- [Download");
  });
});
