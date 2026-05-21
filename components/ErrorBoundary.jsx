import { Component } from "react";

/**
 * React error boundary with Char-voiced fallback.
 * Catches render errors in the component tree below it.
 *
 * Uses inline styles only (no brand.jsx import) to keep the _app
 * chunk small — this component loads on every page but only renders
 * its fallback UI on crashes.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
            background: "#1A1A1A",
            color: "#F5EDE0",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* Simple flame emoji stand-in — no brand.jsx import needed */}
          <div style={{ fontSize: 64, marginBottom: 24 }}>
            🔥
          </div>

          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(32px, 7vw, 48px)",
              lineHeight: 0.95,
              marginBottom: 16,
              color: "#FF6B1A",
            }}
          >
            "Something's smoking back here."
          </h1>

          <p
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(16px, 4vw, 20px)",
              lineHeight: 1.2,
              marginBottom: 32,
              maxWidth: 400,
              opacity: 0.9,
            }}
          >
            Char knocked something over in the kitchen. Refresh and try again.
            Your idea isn't going anywhere.
          </p>

          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              padding: "16px 28px",
              borderRadius: 12,
              border: "2px solid #1A1A1A",
              background: "#FF2E6E",
              color: "#F5EDE0",
              cursor: "pointer",
              boxShadow: "4px 4px 0 #1A1A1A",
            }}
          >
            Refresh the kitchen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
