import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
});
