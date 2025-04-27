import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1
        className="mb-12 text-5xl font-bold uppercase tracking-widest text-text-primary"
        style={{ textShadow: "0 0 8px rgba(255, 255, 255, 0.6)" }}
      >
        Solo RPG
      </h1>

      <RegisterForm />
    </div>
  );
}
