import { ClerkProvider } from "@clerk/nextjs";
import ErrorBoundary from "../components/ErrorBoundary";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      {...pageProps}
    >
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </ClerkProvider>
  );
}
