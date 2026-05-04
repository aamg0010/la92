import { cn } from "@/lib/utils";
import dentryLogo from "@/assets/logo-dentry-dark.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
  showText?: boolean;
}

export function Logo({ className, size = "md", variant = "full", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 40, text: "text-sm" },
    md: { icon: 56, text: "text-base" },
    lg: { icon: 72, text: "text-lg" },
    xl: { icon: 96, text: "text-xl" },
  };

  const { icon: iconSize, text: textSize } = sizes[size];

  const LogoIcon = () => (
    <img
      src={dentryLogo}
      alt="dentry!"
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
            dentry!
          </span>
          <span className="text-xs text-muted-foreground">Tu clínica, un paso adelante</span>
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
        src={dentryLogo}
        alt="dentry!"
        className="w-14 h-14 rounded-xl object-contain"
      />
      <div>
        <span className="font-semibold text-foreground text-lg block leading-tight">dentry!</span>
        <span className="text-xs text-muted-foreground">Tu clínica, un paso adelante</span>
      </div>
    </div>
  );
}

// Dark variant for sidebar
export function LogoDark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={dentryLogo}
        alt="dentry!"
        className={cn("rounded-xl object-contain", sizes[size])}
      />
      <div>
        <span className="font-semibold text-sidebar-foreground text-lg block leading-tight">dentry!</span>
        <span className="text-xs text-sidebar-foreground/70">Tu clínica, un paso adelante</span>
      </div>
    </div>
  );
}
