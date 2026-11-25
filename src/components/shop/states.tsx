import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** Понятное действие: кнопка или ссылка */
  action?: React.ReactNode;
  className?: string;
}

/** Пустое состояние: всегда с объяснением и действием. */
export function EmptyState({ icon: Icon, title, description, action, className }: StateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center px-4 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 grid size-14 place-items-center rounded-full bg-surface-muted">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <div className="mt-2 text-sm text-foreground-muted">{description}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

/** Ошибка человеческим языком, без кодов и стектрейсов. */
export function ErrorState({ icon: Icon, title, description, action, className }: StateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-1 rounded-md border border-danger/20 bg-danger-soft p-4 text-sm",
        className,
      )}
    >
      <p className="flex items-center gap-2 font-semibold text-danger">
        {Icon && <Icon className="size-4" aria-hidden />}
        {title}
      </p>
      {description && <div className="text-foreground">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
