import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-lg", className)}
      {...props}
    />
  );
}

export { Skeleton };
