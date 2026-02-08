import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-la92.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
  showText?: boolean;
}

export function Logo({ className, size = "md", variant = "full", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-sm" },
    md: { icon: 40, text: "text-base" },
    lg: { icon: 56, text: "text-lg" },
    xl: { icon: 72, text: "text-xl" },
  };

  const { icon: iconSize, text: textSize } = sizes[size];

  const LogoIcon = () => (
    <img
      src={logoImage}
      alt="Consultorio Odontológico La 92"
      width={iconSize}
      height={iconSize}
      className="flex-shrink-0 rounded-lg object-contain"
    />
  );

  if (variant === "icon") {
    return <LogoIcon />;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoIcon />
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-semibold text-foreground leading-tight", textSize)}>
            Consultorio La 92
          </span>
          <span className="text-xs text-muted-foreground">Odontología Integral & Estética</span>
        </div>
      )}
    </div>
  );
}

// Compact version for headers
export function LogoCompact({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={logoImage}
        alt="La 92"
        className="w-10 h-10 rounded-xl object-contain"
      />
      <div>
        <span className="font-semibold text-foreground text-lg block leading-tight">La 92</span>
        <span className="text-xs text-muted-foreground">Odontología</span>
      </div>
    </div>
  );
}

// Dark variant for sidebar
export function LogoDark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={logoImage}
        alt="La 92"
        className={cn("rounded-xl object-contain", sizes[size])}
      />
      <div>
        <span className="font-semibold text-sidebar-foreground text-lg block leading-tight">La 92</span>
        <span className="text-xs text-sidebar-foreground/70">Odontología</span>
      </div>
    </div>
  );
}
