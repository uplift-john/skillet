import dynamic from "next/dynamic";

// Dynamic import with ssr:false — Clerk components need the browser.
// This also avoids prerender failures when env vars aren't set during build.
const SignInView = dynamic(
  () =>
    import("@clerk/nextjs").then((mod) => {
      const { SignIn } = mod;
      return function SignInWrapper() {
        return (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#1A1A1A",
            }}
          >
            <SignIn
              appearance={{
                variables: {
                  colorPrimary: "#FF2E6E",
                  colorBackground: "#1A1A1A",
                  colorText: "#F5EDE0",
                  colorInputBackground: "#2A2A2A",
                  colorInputText: "#F5EDE0",
                },
              }}
            />
          </div>
        );
      };
    }),
  { ssr: false }
);

export default function SignInPage() {
  return <SignInView />;
}
