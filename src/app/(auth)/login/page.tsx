import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Main Title */}
      <h1 className="text-5xl font-bold text-text-primary mb-12 tracking-widest uppercase" 
          style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.6)' }}> 
        {/* Using inline style for simple text shadow glow effect */}
        Solo RPG
      </h1>

      {/* LoginForm is already centered by flex container, styling will be inside LoginForm component */}
        <LoginForm />

      {/* Removed the old container and register link from here, will integrate into LoginForm */}
    </div>
  );
} 