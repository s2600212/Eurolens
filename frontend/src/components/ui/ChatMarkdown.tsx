import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ChatMarkdownProps {
    content: string;
    onInternalNavigate?: () => void;
}

export function ChatMarkdown({ content, onInternalNavigate }: ChatMarkdownProps) {
    const navigate = useNavigate();

    const handleLinkClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
            e.preventDefault();
            e.stopPropagation();

            if (href.startsWith("/")) {
                navigate(href);
                onInternalNavigate?.();
            } else if (href.startsWith("http")) {
                window.open(href, "_blank", "noopener,noreferrer");
            }
        },
        [navigate, onInternalNavigate]
    );

    const blocks = parseBlocks(content);

    return (
        <div>
            {blocks.map((block, i) => renderBlock(block, i, handleLinkClick))}
        </div>
    );
}

// ============================================
// Block-level types
// ============================================

type BlockNode =
    | { type: "paragraph"; text: string }
    | { type: "heading"; level: number; text: string }
    | { type: "code"; language: string; text: string }
    | { type: "ulist"; items: string[] }
    | { type: "olist"; items: string[] }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "hr" }
    | { type: "blank" };

// ============================================
// Block-level parsing
// ============================================

function parseBlocks(content: string): BlockNode[] {
    const lines = content.split("\n");
    const blocks: BlockNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Blank line
        if (line.trim() === "") {
            blocks.push({ type: "blank" });
            i++;
            continue;
        }

        // Fenced code block
        if (line.trim().startsWith("```")) {
            const lang = line.trim().slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            if (i < lines.length) i++; // skip closing ```
            blocks.push({ type: "code", language: lang, text: codeLines.join("\n") });
            continue;
        }

        // Horizontal rule
        if (/^[-*_]{3,}\s*$/.test(line.trim())) {
            blocks.push({ type: "hr" });
            i++;
            continue;
        }

        // Heading
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2] });
            i++;
            continue;
        }

        // Table
        if (line.includes("|") && i + 1 < lines.length && /^[\s|:-]+$/.test(lines[i + 1])) {
            const headers = parsePipeLine(line);
            i += 2;
            const rows: string[][] = [];
            while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
                rows.push(parsePipeLine(lines[i]));
                i++;
            }
            blocks.push({ type: "table", headers, rows });
            continue;
        }

        // Unordered list
        if (/^\s*[-*+]\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
                i++;
            }
            blocks.push({ type: "ulist", items });
            continue;
        }

        // Ordered list
        if (/^\s*\d+[.)]\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
                i++;
            }
            blocks.push({ type: "olist", items });
            continue;
        }

        // Paragraph
        const paraLines: string[] = [];
        while (i < lines.length && !isBlockStart(lines[i], lines[i + 1])) {
            if (lines[i].trim() === "") break;
            paraLines.push(lines[i]);
            i++;
        }
        if (paraLines.length > 0) {
            blocks.push({ type: "paragraph", text: paraLines.join(" ") });
        }
    }

    return blocks;
}

function isBlockStart(line: string, nextLine?: string): boolean {
    if (!line || line.trim() === "") return true;
    if (line.trim().startsWith("```")) return true;
    if (/^#{1,6}\s+/.test(line)) return true;
    if (/^[-*_]{3,}\s*$/.test(line.trim())) return true;
    if (/^\s*[-*+]\s+/.test(line)) return true;
    if (/^\s*\d+[.)]\s+/.test(line)) return true;
    if (line.includes("|") && nextLine && /^[\s|:-]+$/.test(nextLine)) return true;
    return false;
}

function parsePipeLine(line: string): string[] {
    return line
        .split("|")
        .map((c) => c.trim())
        .filter((c, i, arr) => {
            if (i === 0 && c === "") return false;
            if (i === arr.length - 1 && c === "") return false;
            return true;
        });
}

// ============================================
// Inline parsing
// ============================================

type InlineNode =
    | { type: "text"; content: string }
    | { type: "bold"; content: string }
    | { type: "italic"; content: string }
    | { type: "bolditalic"; content: string }
    | { type: "code"; content: string }
    | { type: "link"; content: string; href: string };

function parseInline(text: string): InlineNode[] {
    const nodes: InlineNode[] = [];
    let pos = 0;
    const len = text.length;

    while (pos < len) {
        // Try link: [text](url)
        if (text[pos] === "[") {
            const closeBracket = text.indexOf("]", pos + 1);
            if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
                const closeParen = text.indexOf(")", closeBracket + 2);
                if (closeParen !== -1) {
                    const linkText = text.slice(pos + 1, closeBracket);
                    const linkHref = text.slice(closeBracket + 2, closeParen);
                    if (linkText.length > 0 && linkHref.length > 0) {
                        nodes.push({ type: "link", content: linkText, href: linkHref });
                        pos = closeParen + 1;
                        continue;
                    }
                }
            }
        }

        // Try inline code: `text`
        if (text[pos] === "`") {
            const closeBack = text.indexOf("`", pos + 1);
            if (closeBack !== -1) {
                nodes.push({ type: "code", content: text.slice(pos + 1, closeBack) });
                pos = closeBack + 1;
                continue;
            }
        }

        // Try bold italic: ***text***
        if (text[pos] === "*" && text[pos + 1] === "*" && text[pos + 2] === "*") {
            const end = text.indexOf("***", pos + 3);
            if (end !== -1) {
                nodes.push({ type: "bolditalic", content: text.slice(pos + 3, end) });
                pos = end + 3;
                continue;
            }
        }

        // Try bold: **text**
        if (text[pos] === "*" && text[pos + 1] === "*") {
            const end = text.indexOf("**", pos + 2);
            if (end !== -1) {
                nodes.push({ type: "bold", content: text.slice(pos + 2, end) });
                pos = end + 2;
                continue;
            }
        }

        // Try italic: *text*
        if (text[pos] === "*" && text[pos + 1] !== "*") {
            const end = text.indexOf("*", pos + 1);
            if (end !== -1 && end > pos + 1) {
                nodes.push({ type: "italic", content: text.slice(pos + 1, end) });
                pos = end + 1;
                continue;
            }
        }

        // Try italic: _text_
        if (text[pos] === "_") {
            const end = text.indexOf("_", pos + 1);
            if (end !== -1 && end > pos + 1) {
                nodes.push({ type: "italic", content: text.slice(pos + 1, end) });
                pos = end + 1;
                continue;
            }
        }

        // Plain text: consume until next special char
        let nextPos = pos + 1;
        while (nextPos < len) {
            const ch = text[nextPos];
            if (ch === "[" || ch === "`" || ch === "*" || ch === "_") break;
            nextPos++;
        }
        nodes.push({ type: "text", content: text.slice(pos, nextPos) });
        pos = nextPos;
    }

    return nodes;
}

// ============================================
// Rendering
// ============================================

type LinkClickHandler = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;

function renderInline(text: string, onLinkClick: LinkClickHandler): React.ReactNode[] {
    const nodes = parseInline(text);

    return nodes.map((node, i) => {
        switch (node.type) {
            case "text":
                return <span key={i}>{node.content}</span>;

            case "bold":
                return (
                    <strong key={i} style={{ fontWeight: 600 }}>
                        {renderInline(node.content, onLinkClick)}
                    </strong>
                );

            case "italic":
                return (
                    <em key={i}>
                        {renderInline(node.content, onLinkClick)}
                    </em>
                );

            case "bolditalic":
                return (
                    <strong key={i} style={{ fontWeight: 600, fontStyle: "italic" }}>
                        {renderInline(node.content, onLinkClick)}
                    </strong>
                );

            case "code":
                return (
                    <code
                        key={i}
                        style={{
                            backgroundColor: "var(--color-surface-active)",
                            padding: "0.1rem 0.3rem",
                            borderRadius: "3px",
                            fontSize: "0.75rem",
                            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                        }}
                    >
                        {node.content}
                    </code>
                );

            case "link":
                return (
                    <a
                        key={i}
                        href={node.href}
                        onClick={(e) => onLinkClick(e, node.href)}
                        target={node.href.startsWith("/") ? undefined : "_blank"}
                        rel={node.href.startsWith("/") ? undefined : "noopener noreferrer"}
                        style={{
                            color: "var(--color-brand-500)",
                            textDecoration: "underline",
                            textDecorationColor: "color-mix(in srgb, var(--color-brand-500) 40%, transparent)",
                            textUnderlineOffset: "2px",
                            cursor: "pointer",
                            fontWeight: 500,
                        }}
                    >
                        {node.content}
                    </a>
                );

            default:
                return null;
        }
    });
}

function renderBlock(
    block: BlockNode,
    key: number,
    onLinkClick: LinkClickHandler
): React.ReactNode {
    switch (block.type) {
        case "blank":
            return <div key={key} style={{ height: "0.375rem" }} />;

        case "hr":
            return (
                <hr
                    key={key}
                    style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "0.5rem 0" }}
                />
            );

        case "heading": {
            const fontSize = block.level === 1 ? "1rem" : block.level === 2 ? "0.9375rem" : "0.875rem";
            return (
                <p
                    key={key}
                    style={{
                        fontSize,
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        margin: "0.625rem 0 0.25rem 0",
                        lineHeight: 1.4,
                    }}
                >
                    {renderInline(block.text, onLinkClick)}
                </p>
            );
        }

        case "code":
            return (
                <pre
                    key={key}
                    style={{
                        backgroundColor: "var(--color-surface-active)",
                        borderRadius: "var(--radius-sm)",
                        padding: "0.625rem 0.75rem",
                        fontSize: "0.7rem",
                        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                        overflowX: "auto",
                        margin: "0.375rem 0",
                        border: "1px solid var(--color-border)",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    <code>{block.text}</code>
                </pre>
            );

        case "ulist":
            return (
                <ul
                    key={key}
                    style={{
                        margin: "0.25rem 0",
                        paddingLeft: "1.5rem",
                        listStyleType: "disc",
                    }}
                >
                    {block.items.map((item, li) => (
                        <li key={li} style={{ fontSize: "0.8125rem", lineHeight: 1.6, paddingLeft: "0.25rem" }}>
                            {renderInline(item, onLinkClick)}
                        </li>
                    ))}
                </ul>
            );

        case "olist":
            return (
                <ol
                    key={key}
                    style={{
                        margin: "0.25rem 0",
                        paddingLeft: "1.5rem",
                        listStyleType: "decimal",
                    }}
                >
                    {block.items.map((item, li) => (
                        <li key={li} style={{ fontSize: "0.8125rem", lineHeight: 1.6, paddingLeft: "0.25rem" }}>
                            {renderInline(item, onLinkClick)}
                        </li>
                    ))}
                </ol>
            );

        case "table":
            return (
                <div
                    key={key}
                    style={{
                        overflowX: "auto",
                        margin: "0.375rem 0",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", lineHeight: 1.5 }}>
                        <thead>
                            <tr>
                                {block.headers.map((header, hi) => (
                                    <th
                                        key={hi}
                                        style={{
                                            padding: "0.375rem 0.625rem",
                                            textAlign: "left",
                                            fontWeight: 600,
                                            color: "var(--color-text-primary)",
                                            backgroundColor: "var(--color-surface-hover)",
                                            borderBottom: "1px solid var(--color-border)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {renderInline(header, onLinkClick)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {block.rows.map((row, ri) => (
                                <tr key={ri}>
                                    {row.map((cell, ci) => (
                                        <td
                                            key={ci}
                                            style={{
                                                padding: "0.375rem 0.625rem",
                                                color: "var(--color-text-secondary)",
                                                borderBottom: ri < block.rows.length - 1 ? "1px solid var(--color-border)" : "none",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {renderInline(cell, onLinkClick)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case "paragraph":
            return (
                <p key={key} style={{ margin: "0.25rem 0", fontSize: "0.8125rem", lineHeight: 1.6 }}>
                    {renderInline(block.text, onLinkClick)}
                </p>
            );

        default:
            return null;
    }
}