import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Main Title */}
      <h1
        className="mb-12 text-5xl font-bold uppercase tracking-widest text-text-primary"
        style={{ textShadow: "0 0 8px rgba(255, 255, 255, 0.6)" }}
      >
        {/* Using inline style for simple text shadow glow effect */}
        Solo RPG
      </h1>

      {/* LoginForm is already centered by flex container, styling will be inside LoginForm component */}
      <LoginForm />

      {/* Removed the old container and register link from here, will integrate into LoginForm */}
    </div>
  );
}
