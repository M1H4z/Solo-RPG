import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AuthErrorPage() {
  // TODO: Potentially read error messages from searchParams if provided by the auth redirect
  // const searchParams = useSearchParams();
  // const errorMessage = searchParams.get('error_description') || 'An unknown error occurred.';
  const errorMessage =
    "An error occurred during the authentication process. Please try again."; // Default message

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Main Title - Consistent with other auth pages */}
      <h1
        className="mb-12 text-5xl font-bold uppercase tracking-widest text-text-primary"
        style={{ textShadow: "0 0 8px rgba(255, 255, 255, 0.6)" }}
      >
        Solo RPG
      </h1>

      {/* Error Card */}
      <Card className="w-full max-w-md border-danger shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-danger">
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-text-secondary">{errorMessage}</p>
          <Button
            variant="outline"
            className="border-danger text-danger hover:bg-danger/10 focus-visible:ring-danger"
            asChild
          >
            <Link href="/login">&larr; Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
