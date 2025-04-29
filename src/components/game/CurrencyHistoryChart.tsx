"use client";

import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton"; // Corrected path

// Define the expected shape of a transaction record (matching API response)
interface CurrencyTransaction {
    id: string;
    hunter_id: string;
    transaction_time: string; // ISO string
    currency_type: 'gold' | 'diamond';
    amount_change: number;
    new_balance: number;
    source: string;
    source_details?: any;
    created_at: string;
}

interface CurrencyHistoryChartProps {
    hunterId: string | null; 
}

/**
 * Fetches and displays the currency history for a hunter using a line chart.
 */
export const CurrencyHistoryChart: React.FC<CurrencyHistoryChartProps> = ({ hunterId }) => {
    const [transactions, setTransactions] = useState<CurrencyTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!hunterId) {
            setError("Hunter ID is required to fetch currency history.");
            setLoading(false);
            setTransactions([]);
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/hunters/${hunterId}/currency-history`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch currency history");
                }

                setTransactions(data.transactions || []);

            } catch (err: any) {
                console.error("Error fetching currency history:", err);
                setError(err.message);
                setTransactions([]); // Clear data on error
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

    }, [hunterId]); // Refetch if hunterId changes

    // --- Render Logic ---

    if (loading) {
        return <Skeleton className="h-[200px] w-full rounded-md" />; 
    }

    if (error) {
        return <p className="text-sm text-danger text-center py-4">Error: {error}</p>;
    }

    if (transactions.length === 0) {
        return (
            <p className="text-sm text-text-secondary text-center py-4">
                No currency history available yet.
            </p>
        );
    }

    // --- Data Preparation for Recharts ---
    const processChartData = () => {
        if (transactions.length === 0) return [];

        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(a.transaction_time).getTime() - new Date(b.transaction_time).getTime()
        );

        // --- Calculate initial balances ---
        const firstGoldTx = sortedTransactions.find(t => t.currency_type === 'gold');
        const firstDiamondTx = sortedTransactions.find(t => t.currency_type === 'diamonds');
        let initialGold = firstGoldTx ? Math.max(0, firstGoldTx.new_balance - firstGoldTx.amount_change) : 0;
        let initialDiamond = firstDiamondTx ? Math.max(0, firstDiamondTx.new_balance - firstDiamondTx.amount_change) : 0;

        let currentGold = initialGold;
        let currentDiamond = initialDiamond;
        const processedData: { time: number; gold: number; diamond: number }[] = [];

        const firstTime = new Date(sortedTransactions[0].transaction_time).getTime();
        processedData.push({ time: firstTime - 1, gold: initialGold, diamond: initialDiamond }); 

        sortedTransactions.forEach(t => {
            const time = new Date(t.transaction_time).getTime();
            
            // Update balance based on transaction
            if (t.currency_type === 'gold') {
                currentGold = t.new_balance;
            } else if (t.currency_type === 'diamonds') { 
                currentDiamond = t.new_balance;
            }

            // Add/Update point AT transaction time
            const lastPoint = processedData[processedData.length - 1];
            if (lastPoint && lastPoint.time === time) {
                 // If a point already exists at this exact time, update it
                 lastPoint.gold = currentGold;
                 lastPoint.diamond = currentDiamond;
            } else {
                 // Otherwise, add a new point reflecting balance AFTER transaction(s) at this time
                 processedData.push({ time, gold: currentGold, diamond: currentDiamond });
            }
        });

        return processedData;
    };

    const chartData = processChartData();

    // ---- Remove DEBUG LOG ----
    // console.log('Chart Data:', chartData);
    // -------------------

    if (chartData.length <= 1) { // If only the initial point exists
        return (
            <p className="text-sm text-text-secondary text-center py-4">
                No currency history available yet.
            </p>
        );
    }

    const formatXAxis = (tickItem: number) => {
        return new Date(tickItem).toLocaleDateString([], { month: 'short', day: 'numeric', hour:'numeric', minute: '2-digit' });
    };

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart 
                data={chartData}
                margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                    dataKey="time" 
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatXAxis} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                    orientation="left"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={{ stroke: '#334155' }}
                    axisLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                    width={40}
                />
                <Tooltip 
                    contentStyle={{
                        backgroundColor: '#101223',
                        borderColor: '#334155',
                        color: '#f8fafc',
                        fontSize: '12px',
                        borderRadius: '0.375rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                    }}
                    labelFormatter={(label) => formatXAxis(label as number)}
                    cursor={{ stroke: '#f8fafc', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: '#94a3b8' }} />
                <Line 
                    type="monotone" 
                    dataKey="gold" 
                    stroke="#facc15"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={true}
                    name="Gold"
                />
                <Line 
                    type="monotone" 
                    dataKey="diamond" 
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={true}
                    name="Diamond"
                />
            </LineChart>
        </ResponsiveContainer>
    );
};
export default CurrencyHistoryChart; 
