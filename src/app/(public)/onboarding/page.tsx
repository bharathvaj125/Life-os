import { redirect } from "next/navigation";

/** Registration now has its own wizard. This keeps old links working. */
export default function OnboardingPage() {
  redirect("/register");
}
