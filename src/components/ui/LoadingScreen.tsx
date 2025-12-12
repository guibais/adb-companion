import { Loader2 } from "lucide-react";

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

export function LoadingScreen({
  title = "Loading",
  subtitle = "Please wait...",
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
