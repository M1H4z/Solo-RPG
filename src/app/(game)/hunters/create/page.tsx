import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/services/authService";
import { getMyHunters } from "@/services/hunterService";
import { HunterCreatorForm } from "@/components/hunters/HunterCreatorForm";

export default async function CreateHunterPage() {
  const session = await getUserSession();
  if (!session?.user) {
    redirect("/login");
  }

  // Server-side check for max hunters remains
  try {
    const hunters = await getMyHunters();
    if (hunters.length >= 2) {
      console.log("User already has max hunters, redirecting...");
      redirect("/hunters");
    }
  } catch (error) {
    console.error("Could not check hunter count on create page:", error);
  }

  return (
    // Use main page container style
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Main Title - Consistent with other auth pages */}
      <h1
        className="mb-12 text-5xl font-bold uppercase tracking-widest text-text-primary"
        style={{ textShadow: "0 0 8px rgba(255, 255, 255, 0.6)" }}
      >
        Solo RPG
      </h1>

      {/* Form component will be styled internally to look like the target image's card */}
      {/* Removed the old wrapper div */}
      <HunterCreatorForm />
    </div>
  );
}
