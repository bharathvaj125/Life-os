import "server-only";
import { randomUUID } from "node:crypto";
import type { QuoteMessage, QuoteRequest, User, Vendor } from "@/types";
import { ApiError } from "@/lib/api";
import { getRepository } from "@/lib/store";
import type { VendorService } from "@/types";

/** A household can have this many open requests at once, so one account cannot flood installers. */
export const MAX_OPEN_REQUESTS = 5;

export interface ThreadView {
  request: QuoteRequest;
  vendor: Vendor;
  /** First name only, and the area (first three PIN digits). An installer never sees more than that unless the household writes it. */
  citizenFirstName: string;
  citizenArea: string;
  messages: QuoteMessage[];
  /** Whose turn it is: true when the latest message is from the other side. */
  waitingOnYou: boolean;
}

const firstName = (u: User) => u.displayName.replace(/\s*\(demo\)$/i, "").split(" ")[0] ?? "Household";

/** Households can message only installers who have an account here. Public bodies and companies are reached on their own website. */
export async function createQuote(user: User, input: { vendorId: string; topic: VendorService; message: string }, now: Date = new Date()): Promise<{ id: string }> {
  const repo = getRepository();
  const vendor = (await repo.listVendors()).find((v) => v.id === input.vendorId);
  if (!vendor || vendor.status !== "approved") throw new ApiError(404, "That listing is not available.");
  if (!vendor.ownerUserId || (vendor.listingKind && vendor.listingKind !== "installer")) throw new ApiError(422, "This business is reached through its own website. It does not take requests here.");
  if (!vendor.services.includes(input.topic)) throw new ApiError(422, "That business does not offer that service.");
  const mine = await repo.listQuotes({ citizenId: user.id });
  const open = mine.filter((q) => q.status === "open");
  if (open.length >= MAX_OPEN_REQUESTS) throw new ApiError(429, `You already have ${MAX_OPEN_REQUESTS} open requests. Close one before sending another.`);
  if (open.some((q) => q.vendorId === vendor.id)) throw new ApiError(409, "You already have an open request with this business. Continue it from your Quotes page.");
  const at = now.toISOString();
  const request: QuoteRequest = { id: randomUUID(), citizenId: user.id, vendorId: vendor.id, topic: input.topic, status: "open", createdAt: at, updatedAt: at };
  await repo.createQuote(request, { id: randomUUID(), requestId: request.id, authorId: user.id, authorRole: "citizen", body: input.message, createdAt: at });
  return { id: request.id };
}

async function build(requests: QuoteRequest[], viewerRole: "citizen" | "installer"): Promise<ThreadView[]> {
  if (requests.length === 0) return [];
  const repo = getRepository();
  const [vendors, users, messages] = await Promise.all([repo.listVendors(), repo.listUsers(), repo.listMessages(requests.map((r) => r.id))]);
  const out: ThreadView[] = [];
  for (const request of requests) {
    const vendor = vendors.find((v) => v.id === request.vendorId);
    const citizen = users.find((u) => u.id === request.citizenId);
    if (!vendor || !citizen) continue;
    const thread = messages.filter((m) => m.requestId === request.id);
    const last = thread[thread.length - 1];
    out.push({ request, vendor, citizenFirstName: firstName(citizen), citizenArea: citizen.pincode.slice(0, 3), messages: thread, waitingOnYou: request.status === "open" && Boolean(last) && last.authorRole !== viewerRole });
  }
  return out.sort((a, b) => b.request.updatedAt.localeCompare(a.request.updatedAt));
}

export async function listCitizenQuotes(user: User): Promise<ThreadView[]> {
  return build(await getRepository().listQuotes({ citizenId: user.id }), "citizen");
}

export async function listInstallerQuotes(user: User): Promise<ThreadView[]> {
  const repo = getRepository();
  const mine = (await repo.listVendors()).filter((v) => v.ownerUserId === user.id).map((v) => v.id);
  return build(await repo.listQuotes({ vendorIds: mine }), "installer");
}

/** One conversation, only for the household that opened it or the installer who owns the listing. */
export async function getThread(user: User, id: string): Promise<ThreadView> {
  const repo = getRepository();
  const request = await repo.getQuote(id);
  if (!request) throw new ApiError(404, "That conversation does not exist.");
  const role = user.role === "installer" ? "installer" : "citizen";
  const vendor = (await repo.listVendors()).find((v) => v.id === request.vendorId);
  const allowed = role === "citizen" ? request.citizenId === user.id : vendor?.ownerUserId === user.id;
  if (!allowed) throw new ApiError(404, "That conversation does not exist.");
  const [view] = await build([request], role);
  if (!view) throw new ApiError(404, "That conversation does not exist.");
  return view;
}

export async function postMessage(user: User, id: string, body: string, now: Date = new Date()): Promise<{ ok: true }> {
  const view = await getThread(user, id);
  if (view.request.status === "closed") throw new ApiError(409, "This conversation is closed.");
  const role = user.role === "installer" ? "installer" : "citizen";
  await getRepository().addMessage({ id: randomUUID(), requestId: id, authorId: user.id, authorRole: role, body, createdAt: now.toISOString() });
  return { ok: true };
}

export async function closeQuote(user: User, id: string): Promise<{ ok: true }> {
  await getThread(user, id);
  await getRepository().setQuoteStatus(id, "closed");
  return { ok: true };
}
