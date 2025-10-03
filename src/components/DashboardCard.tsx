import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { motion } from "framer-motion";

interface DashboardCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export default function DashboardCard({
  title,
  icon,
  children,
  className = "",
  animate = true,
}: DashboardCardProps) {
  const content = (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-muted/50 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
