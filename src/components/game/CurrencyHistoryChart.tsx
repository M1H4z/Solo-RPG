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

        // Ensure transactions are sorted by time (API should handle this, but good practice)
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(a.transaction_time).getTime() - new Date(b.transaction_time).getTime()
        );

        let currentGold = 0;
        let currentDiamond = 0;
        const processedData: { time: number; gold: number; diamond: number }[] = [];

        // Optional: Add an initial zero point slightly before the first transaction
        // This helps anchor the line chart if the first transaction isn't at time 0
        const firstTime = new Date(sortedTransactions[0].transaction_time).getTime();
        processedData.push({ time: firstTime - 1, gold: 0, diamond: 0 }); // Add point just before

        sortedTransactions.forEach(t => {
            const time = new Date(t.transaction_time).getTime();
            if (t.currency_type === 'gold') {
                currentGold = t.new_balance;
            } else if (t.currency_type === 'diamond') {
                currentDiamond = t.new_balance;
            }
            // Add a point for this transaction time with current balances for BOTH currencies
            processedData.push({ time, gold: currentGold, diamond: currentDiamond });
        });

        // Ensure no duplicate times if multiple transactions happen at once (e.g., DB trigger)
        // This could be refined further if needed, but usually time resolution is sufficient.

        return processedData;
    };

    const chartData = processChartData();

    // ---- DEBUG LOG ----
    console.log('Chart Data:', chartData);
    // -------------------

    // If still no chartData after processing (edge case), show empty message
     if (chartData.length === 0) {
        return (
            <p className="text-sm text-text-secondary text-center py-4">
                No currency history available yet.
            </p>
        );
    }

    const formatXAxis = (tickItem: number) => {
         // Format timestamp to a readable date/time string
        return new Date(tickItem).toLocaleDateString([], { month: 'short', day: 'numeric', hour:'numeric', minute: '2-digit' });
    };

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart 
                data={chartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }} // Adjusted margins
            >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)"/>
                <XAxis 
                    dataKey="time" 
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatXAxis} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                    yAxisId="left" 
                    orientation="left"
                    stroke="hsl(var(--accent-gold))"
                    tick={{ fontSize: 10, fill: 'hsl(var(--accent-gold))' }}
                    tickLine={{ stroke: 'hsl(var(--accent-gold))' }}
                    axisLine={{ stroke: 'hsl(var(--accent-gold))' }}
                    allowDecimals={false}
                />
                 <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    stroke="hsl(var(--accent-diamond))"
                    tick={{ fontSize: 10, fill: 'hsl(var(--accent-diamond))' }}
                    tickLine={{ stroke: 'hsl(var(--accent-diamond))' }}
                    axisLine={{ stroke: 'hsl(var(--accent-diamond))' }}
                    allowDecimals={false}
                 />
                <Tooltip 
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        fontSize: '12px',
                        borderRadius: 'var(--radius)',
                    }}
                    labelFormatter={(label) => formatXAxis(label as number)}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }}/>
                <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="gold" 
                    stroke="hsl(var(--accent-gold))"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={true}
                    name="Gold"
                />
                <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="diamond" 
                    stroke="hsl(var(--accent-diamond))"
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