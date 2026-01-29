import { cn } from "@/lib/utils";

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

  // SVG Logo recreating the business card design
  // Stylized tooth with "LA" text and "92" with teal accent circle
  const LogoIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Stylized tooth outline */}
      <path
        d="M25 35C25 25 35 15 50 15C65 15 75 25 75 35C75 45 72 50 70 58C68 66 65 78 60 85C57 90 53 90 50 90C47 90 43 90 40 85C35 78 32 66 30 58C28 50 25 45 25 35Z"
        stroke="hsl(174, 62%, 45%)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner tooth detail - root lines */}
      <path
        d="M42 55C44 65 46 75 48 82"
        stroke="hsl(174, 62%, 45%)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M58 55C56 65 54 75 52 82"
        stroke="hsl(174, 62%, 45%)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Top crown detail */}
      <path
        d="M35 35C38 28 45 25 50 25C55 25 62 28 65 35"
        stroke="hsl(174, 62%, 45%)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* LA text positioned to the left */}
      <text
        x="8"
        y="58"
        fontFamily="Arial, sans-serif"
        fontSize="14"
        fontWeight="600"
        fontStyle="italic"
        fill="hsl(200, 15%, 45%)"
      >
        LA
      </text>
      {/* 92 text with the 9 having a circle accent */}
      <text
        x="68"
        y="58"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight="700"
        fill="hsl(200, 15%, 45%)"
      >
        92
      </text>
      {/* Teal circle accent on the 9 */}
      <circle
        cx="76"
        cy="46"
        r="8"
        fill="hsl(174, 62%, 45%)"
        opacity="0.9"
      />
    </svg>
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
          <span className="text-xs text-muted-foreground">Odontología Integral</span>
        </div>
      )}
    </div>
  );
}

// Compact version for headers
export function LogoCompact({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Simplified tooth */}
          <path
            d="M25 35C25 25 35 15 50 15C65 15 75 25 75 35C75 45 72 50 70 58C68 66 65 78 60 85C57 90 53 90 50 90C47 90 43 90 40 85C35 78 32 66 30 58C28 50 25 45 25 35Z"
            stroke="white"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
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
    sm: { icon: 32, container: "w-8 h-8" },
    md: { icon: 40, container: "w-10 h-10" },
    lg: { icon: 48, container: "w-12 h-12" },
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("rounded-xl bg-primary flex items-center justify-center", sizes[size].container)}>
        <svg
          width={sizes[size].icon * 0.7}
          height={sizes[size].icon * 0.7}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M25 35C25 25 35 15 50 15C65 15 75 25 75 35C75 45 72 50 70 58C68 66 65 78 60 85C57 90 53 90 50 90C47 90 43 90 40 85C35 78 32 66 30 58C28 50 25 45 25 35Z"
            stroke="white"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <span className="font-semibold text-sidebar-foreground text-lg block leading-tight">La 92</span>
        <span className="text-xs text-sidebar-foreground/70">Odontología</span>
      </div>
    </div>
  );
}
