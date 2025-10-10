import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage",
  description: "Manage your poll settings, add topics, view participants, and export results",
  openGraph: {
    title: "Manage Poll",
    description: "Admin panel to manage your poll. Control settings, add/remove topics, and download results.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Manage Poll",
    description: "Admin panel to manage your poll. Control settings, add/remove topics, and download results.",
  },
};

export default function AdminManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
