import type { Metadata, Viewport } from "next";
import { AppHeader } from "@/components/campusfix/AppHeader";
import "./globals.css";
import { currentUser } from "@/lib/auth/server";
export const metadata: Metadata = {
  title: "CampusFix AI — See it. Report it. Fix it.",
  description:
    "A multimodal campus operations agent powered by Google Gemini. Turn a photo into an actionable service request.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CampusFix AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#cc292b",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {user && <AppHeader role={user.role} />}
        {children}
        {user && (
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
                University. For emergencies, contact official emergency
                services.
              </span>
            </p>
          </footer>
        )}
      </body>
    </html>
  );
}
