import { useState, useRef, useEffect } from "react";
import { X, Send, Trash2, MessageCircle, Loader2 } from "lucide-react";
import { useChat, consumePendingChartContext } from "@/hooks/useChat";
import { ChatMarkdown } from "./ChatMarkdown";

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
    const { messages, isLoading, error, sendMessage, clearChat, chartContext, setActiveChartContext } = useChat();
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            // Pick up any pending chart context
            const pending = consumePendingChartContext();
            if (pending) {
                setActiveChartContext(pending);
            }
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen, setActiveChartContext]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            sendMessage(input);
            setInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
        if (e.key === "Escape") {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Mobile overlay */}
            <div
                className="chat-mobile-overlay"
                style={{
                    display: "none",
                    position: "fixed",
                    inset: 0,
                    zIndex: 59,
                    backgroundColor: "rgba(0,0,0,0.5)",
                }}
                onClick={onClose}
                aria-hidden="true"
            />

            <section
                role="dialog"
                aria-label="Eurolens AI Chat"
                className="chat-panel"
                style={{
                    position: "fixed",
                    bottom: "1rem",
                    right: "1rem",
                    width: "400px",
                    height: "560px",
                    zIndex: 60,
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-lg)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <header
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid var(--color-border)",
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div
                            style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                backgroundColor: "var(--color-brand-500)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <MessageCircle size={14} style={{ color: "#fff" }} aria-hidden="true" />
                        </div>
                        <div>
                            <h2
                                style={{
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                    color: "var(--color-text-primary)",
                                    margin: 0,
                                    lineHeight: 1.2,
                                }}
                            >
                                Eurolens AI
                            </h2>
                            <p
                                style={{
                                    fontSize: "0.6875rem",
                                    color: "var(--color-text-muted)",
                                    margin: 0,
                                    lineHeight: 1.2,
                                }}
                            >
                                Economic data assistant
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        {messages.length > 0 && (
                            <button
                                onClick={clearChat}
                                aria-label="Clear chat history"
                                title="Clear chat"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "2rem",
                                    height: "2rem",
                                    border: "none",
                                    borderRadius: "var(--radius-md)",
                                    backgroundColor: "transparent",
                                    color: "var(--color-text-muted)",
                                    cursor: "pointer",
                                    transition: "all 150ms ease",
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = "var(--color-surface-hover)";
                                    e.currentTarget.style.color = "var(--color-text-secondary)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "var(--color-text-muted)";
                                }}
                            >
                                <Trash2 size={14} aria-hidden="true" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            aria-label="Close chat"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "2rem",
                                height: "2rem",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                backgroundColor: "transparent",
                                color: "var(--color-text-muted)",
                                cursor: "pointer",
                                transition: "all 150ms ease",
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--color-surface-hover)";
                                e.currentTarget.style.color = "var(--color-text-secondary)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "var(--color-text-muted)";
                            }}
                        >
                            <X size={16} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                    }}
                >
                    {messages.length === 0 && !isLoading && (
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                padding: "1.5rem",
                                gap: "0.75rem",
                            }}
                        >
                            <div
                                style={{
                                    width: "3rem",
                                    height: "3rem",
                                    borderRadius: "50%",
                                    backgroundColor: "var(--color-surface-hover)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <MessageCircle
                                    size={24}
                                    style={{ color: "var(--color-brand-500)" }}
                                    aria-hidden="true"
                                />
                            </div>
                            <div>
                                <p
                                    style={{
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                        color: "var(--color-text-primary)",
                                        margin: "0 0 0.25rem 0",
                                    }}
                                >
                                    Ask me about EU economics
                                </p>
                                <p
                                    style={{
                                        fontSize: "0.75rem",
                                        color: "var(--color-text-muted)",
                                        margin: 0,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    I can explain ECB rates, inflation trends, GDP data, and help you navigate the dashboard.
                                </p>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.375rem",
                                    width: "100%",
                                    marginTop: "0.5rem",
                                }}
                            >
                                {[
                                    "What's the current ECB interest rate?",
                                    "Compare inflation in Germany vs France",
                                    "Which country has the highest GDP growth?",
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => sendMessage(suggestion)}
                                        style={{
                                            padding: "0.5rem 0.75rem",
                                            fontSize: "0.75rem",
                                            color: "var(--color-text-secondary)",
                                            backgroundColor: "var(--color-surface-hover)",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "var(--radius-md)",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "all 150ms ease",
                                            lineHeight: 1.4,
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = "var(--color-surface-active)";
                                            e.currentTarget.style.borderColor = "var(--color-border-strong)";
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = "var(--color-surface-hover)";
                                            e.currentTarget.style.borderColor = "var(--color-border)";
                                        }}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chart context banner */}
                    {chartContext && (
                        <div
                            style={{
                                padding: "0.5rem 0.75rem",
                                borderRadius: "var(--radius-md)",
                                backgroundColor: "color-mix(in srgb, var(--color-brand-500) 8%, transparent)",
                                border: "1px solid color-mix(in srgb, var(--color-brand-500) 15%, transparent)",
                                fontSize: "0.75rem",
                                color: "var(--color-brand-700)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.5rem",
                            }}
                        >
                            <span>📊 Asking about: <strong>{chartContext.split("\n")[0]}</strong></span>
                            <button
                                onClick={() => setActiveChartContext(null)}
                                aria-label="Clear chart context"
                                style={{
                                    border: "none",
                                    background: "none",
                                    color: "var(--color-brand-600)",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                    padding: "0 0.25rem",
                                    fontWeight: 600,
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            style={{
                                display: "flex",
                                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                            }}
                        >
                            <div
                                style={{
                                    maxWidth: "85%",
                                    padding: "0.625rem 0.875rem",
                                    borderRadius:
                                        msg.role === "user"
                                            ? "var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)"
                                            : "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)",
                                    backgroundColor:
                                        msg.role === "user"
                                            ? "var(--color-brand-500)"
                                            : "var(--color-surface-hover)",
                                    color:
                                        msg.role === "user" ? "#ffffff" : "var(--color-text-primary)",
                                    fontSize: "0.8125rem",
                                    lineHeight: 1.6,
                                    overflowWrap: "break-word",
                                    wordBreak: "normal",
                                }}
                            >
                                {msg.role === "assistant" ? (
                                    <ChatMarkdown content={msg.content} onInternalNavigate={onClose} />
                                ) : (
                                    <p style={{ margin: 0 }}>{msg.content}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                            <div
                                style={{
                                    padding: "0.625rem 0.875rem",
                                    borderRadius: "var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)",
                                    backgroundColor: "var(--color-surface-hover)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                <Loader2
                                    size={14}
                                    style={{
                                        color: "var(--color-brand-500)",
                                        animation: "spin 1s linear infinite",
                                    }}
                                    aria-hidden="true"
                                />
                                <span
                                    style={{
                                        fontSize: "0.8125rem",
                                        color: "var(--color-text-muted)",
                                    }}
                                >
                                    Thinking...
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div
                            role="alert"
                            style={{
                                padding: "0.5rem 0.75rem",
                                borderRadius: "var(--radius-md)",
                                backgroundColor: "color-mix(in srgb, var(--color-error) 8%, transparent)",
                                border: "1px solid color-mix(in srgb, var(--color-error) 20%, transparent)",
                                fontSize: "0.75rem",
                                color: "var(--color-error)",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        padding: "0.75rem 1rem",
                        borderTop: "1px solid var(--color-border)",
                        flexShrink: 0,
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-end",
                    }}
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about EU economics..."
                        disabled={isLoading}
                        rows={1}
                        aria-label="Chat message input"
                        style={{
                            flex: 1,
                            resize: "none",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "0.5rem 0.75rem",
                            fontSize: "0.8125rem",
                            lineHeight: 1.5,
                            backgroundColor: "var(--color-surface)",
                            color: "var(--color-text-primary)",
                            outline: "none",
                            fontFamily: "inherit",
                            maxHeight: "5rem",
                            overflow: "auto",
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = "var(--color-brand-400)";
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = "var(--color-border)";
                        }}
                        onInput={(e) => {
                            const target = e.currentTarget;
                            target.style.height = "auto";
                            target.style.height = Math.min(target.scrollHeight, 80) + "px";
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        aria-label="Send message"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "2.25rem",
                            height: "2.25rem",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            backgroundColor:
                                !input.trim() || isLoading
                                    ? "var(--color-surface-active)"
                                    : "var(--color-brand-500)",
                            color:
                                !input.trim() || isLoading
                                    ? "var(--color-text-muted)"
                                    : "#ffffff",
                            cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                            flexShrink: 0,
                            transition: "all 150ms ease",
                        }}
                    >
                        <Send size={16} aria-hidden="true" />
                    </button>
                </form>
            </section>

            {/* Responsive + spinner animation styles */}
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 767px) {
          .chat-mobile-overlay {
            display: block !important;
          }
          .chat-panel {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
        </>
    );
}