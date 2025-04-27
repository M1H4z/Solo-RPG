'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    
    setLoading(true);
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Login failed. Please try again.');
      } else {
        router.push('/hunters');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected network error occurred. Please try again.');
      console.error('Login fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "relative w-full max-w-md p-8 bg-surface rounded-lg shadow-lg",
      "border border-secondary shadow-glow-secondary"
    )}>
      <div className="text-center mb-8"> 
        <h2 className="text-3xl font-bold text-text-primary uppercase tracking-wide">Hunter's Portal</h2>
        <p className="text-sm text-text-secondary mt-2">Enter the world of hunters and monsters</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
      />

        {error && <p className="text-danger text-sm text-center py-1">{error}</p>}
        
        <div className="flex items-center justify-between space-x-4 pt-2">
          <Button 
            type="submit" 
            disabled={loading} 
            variant="secondary" 
            glow="secondary"
            className="flex-1"
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </Button>
          <Button 
            type="button"
            disabled={loading} 
            variant="outline" 
            onClick={() => router.push('/register')}
            className="flex-1 border-secondary text-secondary hover:bg-secondary/10 focus-visible:ring-secondary"
          >
            REGISTER
      </Button>
        </div>
    </form>
    </div>
  );
} 