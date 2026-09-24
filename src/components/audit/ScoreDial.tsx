import { cn } from "@/lib/utils";

function toneFor(score: number) {
  if (score >= 80) return "text-pass";
  if (score >= 60) return "text-warn";
  return "text-fail";
}

export function ScoreDial({
  score,
  grade,
  size = 160,
  label = "Profile score",
}: {
  score: number;
  grade?: string;
  size?: number;
  label?: string;
}) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${score} out of 100`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-border"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className={cn("transition-[stroke-dashoffset] duration-700", toneFor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-display text-4xl font-semibold", toneFor(score))}>{score}</span>
          <span className="text-xs text-muted-foreground">out of 100</span>
        </div>
      </div>
      {grade ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Grade <span className="font-semibold text-foreground">{grade}</span>
        </p>
      ) : null}
    </div>
  );
}
