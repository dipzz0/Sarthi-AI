import logo from "@/assets/sarthi-ai-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <img
        src={logo.url}
        alt="Sarthi AI"
        className={cn("shrink-0 object-contain", compact ? "size-10" : "h-12 w-12")}
      />
      <span
        className={cn(
          "whitespace-nowrap font-display font-semibold text-ink",
          compact ? "text-lg" : "text-xl sm:text-2xl",
        )}
      >
        Sarthi <span className="text-sunset">AI</span>
      </span>
    </span>
  );
}