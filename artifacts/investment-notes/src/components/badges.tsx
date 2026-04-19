import { Badge } from "@/components/ui/badge";

export function CategoryBadge({ category }: { category: string }) {
  if (category === "pipeline") {
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 rounded font-medium text-xs px-2 py-0.5">
        Pipeline
      </Badge>
    );
  }
  if (category === "portfolio") {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 rounded font-medium text-xs px-2 py-0.5">
        Portfolio
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 rounded font-medium text-xs px-2 py-0.5">
      Generic
    </Badge>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === "positive") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 font-medium text-sm whitespace-nowrap">
        <span>↑</span> Positive
      </span>
    );
  }
  if (sentiment === "negative") {
    return (
      <span className="inline-flex items-center gap-1 text-red-500 font-medium text-sm whitespace-nowrap">
        <span>↓</span> Negative
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm whitespace-nowrap">
      <span>→</span> Neutral
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  if (role === "director") {
    return (
      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
        {role}
      </span>
    );
  }
  if (role === "principal") {
    return (
      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
        {role}
      </span>
    );
  }
  return (
    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
      {role}
    </span>
  );
}

export function CompanyTypeBadge({ type }: { type: string }) {
  if (type === "pipeline") {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 rounded font-medium text-xs px-2 py-0.5">
        Pipeline
      </Badge>
    );
  }
  if (type === "portfolio") {
    return (
      <Badge className="bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100 rounded font-medium text-xs px-2 py-0.5">
        Portfolio
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 rounded font-medium text-xs px-2 py-0.5">
      {type}
    </Badge>
  );
}
