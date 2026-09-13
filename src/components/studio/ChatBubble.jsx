import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { User, Sparkles } from "lucide-react";

export default function ChatBubble({ message, isUser, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary/15 border border-primary/20 text-foreground"
              : "bg-card border border-border/50 text-foreground"
          }`}
        >
          {typeof message === "string" && message.length > 0 ? (
            isUser ? (
              <p className="text-sm leading-relaxed">{message}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => (
                    <p className="my-1 leading-relaxed">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-primary font-semibold">
                      {children}
                    </strong>
                  ),
                }}
              >
                {message}
              </ReactMarkdown>
            )
          ) : null}
          {children}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}
