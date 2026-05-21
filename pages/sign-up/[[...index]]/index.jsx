import dynamic from "next/dynamic";

const SignUpView = dynamic(
  () =>
    import("@clerk/nextjs").then((mod) => {
      const { SignUp } = mod;
      return function SignUpWrapper() {
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
            <SignUp
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

export default function SignUpPage() {
  return <SignUpView />;
}
