import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Ved.AI - AI Assessment Creator",
  description: "Create AI-powered question papers and assessments with ease. Generate structured exam papers with difficulty levels, multiple question types, and instant PDF export.",
  keywords: "AI, assessment, question paper, exam generator, education technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
