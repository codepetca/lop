import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose",
  description: "Enter your name and select one available topic on a first-come, first-served basis",
  openGraph: {
    title: "Choose Your Topic",
    description: "Join this poll to select your topic. Enter your name and claim one available option.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Choose Your Topic",
    description: "Join this poll to select your topic. Enter your name and claim one available option.",
  },
};

export default function PollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
