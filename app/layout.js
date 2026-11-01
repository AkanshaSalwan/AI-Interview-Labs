import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import { Toaster } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Interview — Voice interviews for hiring and practice",
  description:
    "Recruiters run AI voice interviews and get scored reports. Candidates practice with an AI interviewer and track their progress.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Provider>{children}</Provider>
        <Toaster />
      </body>
    </html>
  );
}
