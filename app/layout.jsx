export const metadata = {
  title: "Deposit Analyzer",
  description: "Check screenshot authenticity"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0a0018", color: "#e4ff4f" }}>
        {children}
      </body>
    </html>
  );
}
