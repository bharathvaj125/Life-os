import { redirect } from "next/navigation";

/** Sign-in now lives on the welcome screen. This keeps old links working. */
export default function LoginPage() {
  redirect("/");
}
