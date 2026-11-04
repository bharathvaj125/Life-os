import Link from "next/link";
import { ArrowUpRight, BarChart3, Leaf, ListChecks, Sun, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

const areas = [
  { icon: BarChart3, title: "Know your footprint", text: "Enter last month's units and get a footprint, a baseline and a trend you can trust." },
  { icon: ListChecks, title: "Act on what matters", text: "Nudges built from your own bills and the time of day, plus quick daily and weekly tasks." },
  { icon: Users, title: "Win together", text: "Points, streaks and local challenges that add up to a community goal." },
  { icon: Sun, title: "Go solar with eyes open", text: "A transparent rooftop estimate with ranges, assumptions and official next steps." },
];

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <>
      <section className="hero">
        <span className="badge"><Leaf size={16} aria-hidden="true" /> Mission LiFE</span>
        <p className="eyebrow">LIFESTYLE FOR ENVIRONMENT</p>
        <h1>Small habits.<br />A shared future.</h1>
        <p className="intro">LiFE-OS turns your electricity bill into a footprint, rupee-saving suggestions, a solar estimate and community action. No long questionnaires.</p>
        <Link className="button" href={user ? "/dashboard" : "/onboarding"}>{user ? "Open my dashboard" : "Find my footprint"} <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </section>
      <section aria-label="What you can do" className="grid four">
        {areas.map(({ icon: Icon, title, text }) => (
          <Card key={title} title={title}><Icon aria-hidden="true" size={22} className="card-icon" /><p>{text}</p></Card>
        ))}
      </section>
    </>
  );
}
