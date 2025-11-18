import "./globals.css";

export const metadata = {
  title: "Neon Payment Checker",
  description: "Visually check payment screenshots for tampering"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
