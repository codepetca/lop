import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results",
  description: "View real-time results showing which topics have been claimed and which are still available",
  openGraph: {
    title: "Results",
    description: "Watch live results for this poll. See which topics have been claimed and which are still available.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Results",
    description: "Watch live results for this poll. See which topics have been claimed and which are still available.",
  },
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
