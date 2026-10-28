import Link from "next/link";
import { ArrowUpRight, Leaf } from "lucide-react";
import { Card } from "@/components/ui/card";

const areas = [
  { href: "/dashboard", title: "Your dashboard", text: "A future home for your sustainability journey." },
  { href: "/footprint", title: "Carbon footprint", text: "Understand the impact of everyday choices." },
  { href: "/actions", title: "Sustainable actions", text: "Discover habits and timely nudges." },
  { href: "/community", title: "Community challenges", text: "Build momentum through shared goals." },
  { href: "/resources", title: "Learn & explore", text: "Explore energy awareness and rooftop solar." },
  { href: "/admin", title: "Administration", text: "A foundation for future platform management." },
];

export default function Home() {
  return <><section className="hero"><span className="badge"><Leaf size={16} aria-hidden="true" /> Mission LiFE</span><p className="eyebrow">LIFESTYLE FOR ENVIRONMENT</p><h1>Small habits.<br />A shared future.</h1><p className="intro">LiFE-OS is a foundation for helping citizens understand their impact, adopt sustainable energy habits, and take action together.</p><Link className="button" href="/dashboard">Explore the dashboard <ArrowUpRight size={18} aria-hidden="true" /></Link><p className="muted">Project scaffold · Features will be developed step by step.</p></section><section aria-label="Explore the platform" className="grid">{areas.map(area => <Card key={area.href} title={area.title}><p>{area.text}</p><Link className="text-link" href={area.href}>Explore <span aria-hidden="true">→</span></Link></Card>)}</section></>;
}
