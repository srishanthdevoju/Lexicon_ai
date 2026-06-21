import React from "react";

/**
 * Lightweight markdown renderer for chatbot messages.
 * Supports: numbered lists, bullet lists, bold, italic, code blocks, inline code, headers, and line breaks.
 */
export default function ChatMarkdown({ text }) {
  if (!text) return null;

  // Split by code blocks first (```...```)
  const codeBlockParts = text.split(/(```[\s\S]*?```)/g);

  const rendered = codeBlockParts.map((part, partIdx) => {
    // Render code blocks
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3);
      // Remove optional language identifier on first line
      const lines = inner.split("\n");
      const firstLine = lines[0].trim();
      const isLangTag = /^[a-zA-Z0-9_+-]+$/.test(firstLine) && firstLine.length < 20;
      const code = isLangTag ? lines.slice(1).join("\n") : inner;
      return (
        <pre
          key={partIdx}
          className="bg-slate-100 border border-slate-200 rounded px-3 py-2 my-2 text-[12px] font-mono overflow-x-auto whitespace-pre-wrap"
        >
          {code.trim()}
        </pre>
      );
    }

    // Process non-code-block text
    const lines = part.split("\n");
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines (add spacing)
      if (!trimmed) {
        elements.push(<div key={`${partIdx}-${i}`} className="h-1.5" />);
        i++;
        continue;
      }

      // Headers: ### Header, ## Header, # Header
      const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const headerText = headerMatch[2];
        const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
        const sizeClass = level === 1 ? "text-[14px]" : level === 2 ? "text-[13px]" : "text-[12.5px]";
        elements.push(
          <Tag key={`${partIdx}-${i}`} className={`${sizeClass} font-bold mt-2 mb-1`}>
            {renderInline(headerText)}
          </Tag>
        );
        i++;
        continue;
      }

      // Numbered list: 1. xxx or 1) xxx
      const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
      if (numMatch) {
        // Collect consecutive numbered items
        const listItems = [];
        while (i < lines.length) {
          const itemLine = lines[i].trim();
          const itemMatch = itemLine.match(/^(\d+)[.)]\s+(.+)/);
          if (itemMatch) {
            listItems.push({ num: itemMatch[1], content: itemMatch[2] });
            i++;
          } else if (!itemLine) {
            i++;
            break;
          } else {
            break;
          }
        }
        elements.push(
          <ol key={`${partIdx}-list-${i}`} className="my-1.5 space-y-1 pl-1">
            {listItems.map((item, li) => (
              <li key={li} className="flex gap-2 items-start">
                <span className="font-semibold text-primary/70 shrink-0 min-w-[18px]">{item.num}.</span>
                <span>{renderInline(item.content)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Bullet list: - xxx or * xxx or • xxx
      const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
      if (bulletMatch) {
        const listItems = [];
        while (i < lines.length) {
          const itemLine = lines[i].trim();
          const itemBullet = itemLine.match(/^[-*•]\s+(.+)/);
          if (itemBullet) {
            listItems.push(itemBullet[1]);
            i++;
          } else if (!itemLine) {
            i++;
            break;
          } else {
            break;
          }
        }
        elements.push(
          <ul key={`${partIdx}-ul-${i}`} className="my-1.5 space-y-1 pl-1">
            {listItems.map((item, li) => (
              <li key={li} className="flex gap-2 items-start">
                <span className="text-primary/50 shrink-0 mt-[2px]">•</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Regular paragraph line
      elements.push(
        <p key={`${partIdx}-${i}`} className="my-0.5">
          {renderInline(trimmed)}
        </p>
      );
      i++;
    }

    return <React.Fragment key={partIdx}>{elements}</React.Fragment>;
  });

  return <div className="chat-markdown space-y-0">{rendered}</div>;
}

/**
 * Render inline formatting: **bold**, *italic*, `code`, and plain text
 */
function renderInline(text) {
  if (!text) return null;

  // Split by inline patterns: **bold**, *italic*, `code`
  const parts = [];
  // Regex to match **bold**, *italic*, `code` (in order of precedence)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add plain text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold**
      parts.push(
        <strong key={match.index} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // *italic*
      parts.push(
        <em key={match.index} className="italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // `code`
      parts.push(
        <code key={match.index} className="bg-slate-100 px-1 py-0.5 rounded text-[11.5px] font-mono text-rose-600">
          {match[6]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
