import type { ReactNode } from "react";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function hasControlCharacters(val: string): boolean {
  for (let i = 0; i < val.length; i++) {
    const code = val.charCodeAt(i);
    if ((code >= 0 && code <= 31) || (code >= 127 && code <= 159)) {
      return true;
    }
  }
  return false;
}

function sanitizeHref(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || hasControlCharacters(trimmed)) {
    return null;
  }
  // Safe relative paths starting with a single '/'
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return encodeURI(trimmed);
  }
  // Safe absolute URLs with permitted schemes
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      parsed.protocol === "mailto:" ||
      parsed.protocol === "tel:"
    ) {
      return encodeURI(trimmed);
    }
  } catch {
    return null;
  }
  return null;
}

function renderInline(text: string): ReactNode[] {
  // Regex to match [text](url), **bold**, *italic*
  // Order matters: links first or bold/italic
  const nodes: ReactNode[] = [];
  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = tokenRegex.exec(text);

  while (match !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const [fullMatch, , linkText, linkUrl, boldText, italicText] = match;

    if (linkText && linkUrl) {
      const safeHref = sanitizeHref(linkUrl);
      if (safeHref) {
        const isExternal = /^https?:\/\//i.test(safeHref);
        nodes.push(
          <a
            key={match.index}
            href={safeHref}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            {linkText}
          </a>,
        );
      } else {
        nodes.push(linkText);
      }
    } else if (boldText) {
      nodes.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {boldText}
        </strong>,
      );
    } else if (italicText) {
      nodes.push(
        <em key={match.index} className="italic text-foreground">
          {italicText}
        </em>,
      );
    } else {
      nodes.push(fullMatch);
    }

    lastIndex = match.index + fullMatch.length;
    match = tokenRegex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  if (!content?.trim()) {
    return null;
  }

  // Split into raw blocks by double newlines or single newlines with headings/lists
  const rawLines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Array<{
    type: "h1" | "h2" | "h3" | "ul" | "ol" | "blockquote" | "p";
    items?: string[];
    text?: string;
  }> = [];

  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: "p", text: currentParagraph.join(" ") });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      blocks.push({ type: currentList.type, items: currentList.items });
      currentList = null;
    }
  };

  for (const line of rawLines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Heading 1
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h1", text: trimmed.slice(2).trim() });
      continue;
    }

    // Heading 2
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      continue;
    }

    // Heading 3
    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "blockquote", text: trimmed.slice(2).trim() });
      continue;
    }

    // Bullet List
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      const itemText = trimmed.replace(/^[-*]\s+/, "");
      if (currentList && currentList.type === "ul") {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: "ul", items: [itemText] };
      }
      continue;
    }

    // Numbered List
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      const itemText = trimmed.replace(/^\d+\.\s+/, "");
      if (currentList && currentList.type === "ol") {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: "ol", items: [itemText] };
      }
      continue;
    }

    // Regular line in paragraph
    if (currentList) {
      flushList();
    }
    currentParagraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return (
    <div className={`space-y-4 text-foreground leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        const key = `block-${idx}`;
        switch (block.type) {
          case "h1":
            return (
              <h1
                key={key}
                className="font-serif text-2xl sm:text-3xl font-bold text-foreground mt-4 mb-2"
              >
                {renderInline(block.text || "")}
              </h1>
            );
          case "h2":
            return (
              <h2
                key={key}
                className="font-serif text-xl sm:text-2xl font-bold text-foreground mt-4 mb-2"
              >
                {renderInline(block.text || "")}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={key}
                className="font-serif text-lg sm:text-xl font-bold text-foreground mt-3 mb-1"
              >
                {renderInline(block.text || "")}
              </h3>
            );
          case "blockquote":
            return (
              <blockquote
                key={key}
                className="border-l-4 border-primary/40 pl-4 py-1 italic text-muted-foreground bg-muted/20 rounded-r-md"
              >
                {renderInline(block.text || "")}
              </blockquote>
            );
          case "ul":
            return (
              <ul key={key} className="list-disc list-inside space-y-2 pl-2 text-foreground/90">
                {(block.items || []).map((item) => (
                  <li key={`${key}-${item}`} className="leading-normal">
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="list-decimal list-inside space-y-2 pl-2 text-foreground/90">
                {(block.items || []).map((item) => (
                  <li key={`${key}-${item}`} className="leading-normal">
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={key} className="text-foreground/90 text-sm sm:text-base leading-relaxed">
                {renderInline(block.text || "")}
              </p>
            );
        }
      })}
    </div>
  );
}
