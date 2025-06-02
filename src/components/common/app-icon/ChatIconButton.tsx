import React from "react";

interface ChatIconButtonProps {
  onClick: () => void;
}

const ChatIconButton: React.FC<ChatIconButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 1000,
      background: "#fff",
      borderRadius: "50%",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      width: 56,
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      cursor: "pointer",
    }}
    aria-label="Open chat"
  >
    {/* Bạn có thể thay icon SVG này bằng icon khác nếu muốn */}
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="#fa541c"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

export default ChatIconButton;