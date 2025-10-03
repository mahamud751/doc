import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  className = "",
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {value}
              </h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <div className="bg-primary/10 p-3 rounded-full">{icon}</div>
          </div>
          {trend && (
            <div className="mt-4 flex items-center">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                from last month
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
