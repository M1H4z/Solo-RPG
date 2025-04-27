import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-5xl font-bold text-text-primary mb-12 tracking-widest uppercase" 
          style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.6)' }}> 
        Solo RPG
      </h1>

        <RegisterForm />
    </div>
  );
} 