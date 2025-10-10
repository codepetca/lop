import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create",
  description: "Create a new poll with custom topics for participants to claim on a first-come, first-served basis",
  openGraph: {
    title: "Create Poll",
    description: "Set up a new poll with custom topics. Get shareable links for participants and a results board.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Poll",
    description: "Set up a new poll with custom topics. Get shareable links for participants and a results board.",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
