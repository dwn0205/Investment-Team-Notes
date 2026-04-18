import { Badge } from "@/components/ui/badge";

export function CategoryBadge({ category }: { category: string }) {
  if (category === "pipeline") {
    return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-sm hover:bg-blue-500/20">Pipeline</Badge>;
  }
  if (category === "portfolio") {
    return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 rounded-sm hover:bg-green-500/20">Portfolio</Badge>;
  }
  return <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20 rounded-sm hover:bg-gray-500/20">Generic</Badge>;
}

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === "positive") {
    return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 rounded-sm hover:bg-green-500/20">Positive</Badge>;
  }
  if (sentiment === "negative") {
    return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 rounded-sm hover:bg-red-500/20">Negative</Badge>;
  }
  return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-sm hover:bg-amber-500/20">Neutral</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  if (role === "director") {
    return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 rounded-sm hover:bg-purple-500/20 capitalize">{role}</Badge>;
  }
  if (role === "principal") {
    return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-sm hover:bg-blue-500/20 capitalize">{role}</Badge>;
  }
  return <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20 rounded-sm hover:bg-gray-500/20 capitalize">{role}</Badge>;
}

export function CompanyTypeBadge({ type }: { type: string }) {
  if (type === "pipeline") {
    return <span className="text-xs font-medium px-1.5 py-0.5 rounded text-blue-400 bg-blue-500/10 uppercase tracking-wider">{type}</span>;
  }
  return <span className="text-xs font-medium px-1.5 py-0.5 rounded text-green-400 bg-green-500/10 uppercase tracking-wider">{type}</span>;
}
