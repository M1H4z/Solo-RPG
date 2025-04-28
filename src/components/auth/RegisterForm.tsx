"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
// No longer importing Server Action: import { signUpUser } from '@/services/authService';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { cn } from "@/lib/utils";

// Basic list of countries for the dropdown
const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "South Korea",
  "Brazil",
  "India",
  "Nigeria",
  "South Africa",
  "Mexico",
  "Argentina",
  "Italy",
  "Spain",
  "Malaysia",
  "Singapore",
  "Indonesia",
  "Thailand",
  "Philippines",
  "Vietnam",
  "Brunei",
  "China",
  "Russia",
  "Mongolia",
  "North Korea",
  "Myanmar (Burma)",
  "Pakistan",
  "Kazakhstan",
  // Add more countries as needed
];

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!username || !email || !password || !country) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("country", country);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Registration failed. Please try again.");
      } else {
        setMessage(
          result.message || "Registration successful! Please check your email.",
        );
        // Redirect to login after successful registration (optional)
        // setTimeout(() => router.push('/login'), 3000);
      }
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
      console.error("Registration fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Container with surface bg, rounded corners, padding, and secondary glow shadow
    <div
      className={cn(
        "relative w-full max-w-md p-8 bg-surface rounded-lg shadow-lg",
        "border border-secondary shadow-glow-secondary", // Apply border and glow
      )}
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold uppercase tracking-wide text-text-primary">
          Create Account
        </h2>
        {/* Optional subtitle can be added here */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {" "}
        {/* Slightly adjusted spacing */}
        <Input
          id="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
        />
        <Input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <Input
          id="password"
          type="password"
          placeholder="Password (min. 6 characters)" // Updated placeholder
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
        <Input
          id="confirm-password"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
        {/* Use Shadcn Select structure */}
        <Select
          value={country}
          onValueChange={setCountry}
          required
          disabled={loading}
          name="country"
        >
          <SelectTrigger className={cn(
            "w-full",
            // Match Input styles:
            "flex h-10 rounded-md border border-border-dark bg-surface px-3 py-2 text-sm",
            // Add placeholder styling when no value is selected
            !country && "text-text-secondary",
            // Ensure focus ring matches Input
            "focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-background"
          )}>
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <p className="py-1 text-center text-sm text-danger">{error}</p>
        )}
        {message && (
          <p className="py-1 text-center text-sm text-success">{message}</p>
        )}
        {/* Button Row */}
        <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
          {" "}
          {/* Use gap and flex-col for small screens */}
          <Button
            type="submit"
            disabled={loading || !!message} // Disable if loading or success message shown
            variant="secondary"
            glow="secondary"
            className="w-full sm:flex-1" // Full width on small, flex-1 on larger
          >
            {loading ? "Creating Account..." : "REGISTER"}
          </Button>
          <Button
            type="button"
            disabled={loading}
            variant="outline"
            onClick={() => router.push("/login")} // Navigate to login
            className="w-full border-secondary text-secondary hover:bg-secondary/10 focus-visible:ring-secondary sm:flex-1"
          >
            BACK TO LOGIN
          </Button>
        </div>
      </form>
    </div>
  );
}
