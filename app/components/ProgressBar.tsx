'use client';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="w-full space-y-2">
            {label && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{label}</span>
                    <span className="font-mono font-medium text-primary">
                        {current}/{total} ({percentage}%)
                    </span>
                </div>
            )}
            <div className="h-2.5 rounded-full bg-border overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
