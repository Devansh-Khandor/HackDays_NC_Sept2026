import type { Metadata } from "next";
import { AppHeader } from "@/components/campusfix/AppHeader";
import "./globals.css";
export const metadata: Metadata = {
  title: "CampusFix AI — See it. Report it. Fix it.",
  description:
    "A multimodal campus operations agent powered by Google Gemini. Turn a photo into an actionable service request.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AppHeader />
        {children}
        <footer>
          <div className="footer-brand">
            CampusFix <span>AI</span>
            <small>See it. Report it. Fix it.</small>
          </div>
          <p>
            Hackathon Prototype — Not an official NC State service
            <br />
            <span>
              CampusFix AI is not affiliated with or operated by NC State
              University. For emergencies, contact official emergency services.
            </span>
          </p>
        </footer>
      </body>
    </html>
  );
}
