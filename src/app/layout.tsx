import type { Metadata } from "next";
import "../styles/globals.css";
import { Toaster } from "sonner";
import { SolanaWalletContextProvider } from "@/solana/WalletProvider";

export const metadata: Metadata = {
  title: "Solo Leveling RPG",
  description:
    "A web-based text RPG inspired by Solo Leveling with Pokémon-style combat",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletContextProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </SolanaWalletContextProvider>
      </body>
    </html>
  );
}
