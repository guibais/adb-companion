import { ArrowLeft } from "lucide-react";
import { useUiStore } from "../../stores";

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  const { setCurrentPage } = useUiStore();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentPage("device")}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-bg-tertiary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          {description && (
            <p className="text-sm text-zinc-500">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
