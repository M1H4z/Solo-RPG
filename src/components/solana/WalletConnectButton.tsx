"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";

export const WalletConnectButton = () => {
    const { publicKey, connected } = useWallet();

    useEffect(() => {
        if (connected && publicKey) {
            // Send wallet address to Supabase via API
            fetch("/api/user/wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
            });
        }
    }, [connected, publicKey]);

    return (
        <div>
            <WalletMultiButton />
        </div>
    );
}; 