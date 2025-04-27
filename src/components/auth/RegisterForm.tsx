'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// No longer importing Server Action: import { signUpUser } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

// Basic list of countries for the dropdown
const countries = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", "France", 
  // Add more countries as needed
];

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!username || !email || !password || !country) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('country', country);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Registration failed. Please try again.');
      } else {
        setMessage(result.message || 'Registration successful! Please check your email.');
        // Redirect to login after successful registration (optional)
        // setTimeout(() => router.push('/login'), 3000); 
      }
    } catch (err) {
      setError('An unexpected network error occurred. Please try again.');
      console.error('Registration fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Container with surface bg, rounded corners, padding, and secondary glow shadow
    <div className={cn(
      "relative w-full max-w-md p-8 bg-surface rounded-lg shadow-lg",
      "border border-secondary shadow-glow-secondary" // Apply border and glow
    )}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-primary uppercase tracking-wide">Create Account</h2>
        {/* Optional subtitle can be added here */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5"> {/* Slightly adjusted spacing */}
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
        {/* Use themed Select for Country */}
        <Select
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
          disabled={loading}
        >
          <option value="" disabled>Select Country</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        {error && <p className="text-danger text-sm text-center py-1">{error}</p>}
        {message && <p className="text-success text-sm text-center py-1">{message}</p>}
        
        {/* Button Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2"> {/* Use gap and flex-col for small screens */}
          <Button 
            type="submit" 
            disabled={loading || !!message} // Disable if loading or success message shown
            variant="secondary" 
            glow="secondary" 
            className="w-full sm:flex-1" // Full width on small, flex-1 on larger
          >
            {loading ? 'Creating Account...' : 'REGISTER'}
          </Button>
          <Button 
            type="button" 
            disabled={loading} 
            variant="outline" 
            onClick={() => router.push('/login')} // Navigate to login
            className="w-full sm:flex-1 border-secondary text-secondary hover:bg-secondary/10 focus-visible:ring-secondary"
          >
            BACK TO LOGIN
          </Button>
        </div>
      </form>
    </div>
  );
} 