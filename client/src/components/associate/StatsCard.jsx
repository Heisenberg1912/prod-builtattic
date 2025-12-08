import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = "blue",
  delay = 0,
}) {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    purple: "from-purple-500 to-pink-500",
    green: "from-emerald-500 to-teal-500",
    orange: "from-orange-500 to-amber-500",
  };

  const getTrendIcon = () => {
    if (trend > 0) return TrendingUp;
    if (trend < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend > 0) return "text-green-600";
    if (trend < 0) return "text-red-600";
    return "text-slate-500";
  };

  const TrendIcon = getTrendIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{value}</h3>

              {(trend !== undefined || trendLabel) && (
                <div className="flex items-center gap-1.5 mt-2">
                  {trend !== undefined && (
                    <div className={`flex items-center gap-0.5 ${getTrendColor()}`}>
                      <TrendIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {Math.abs(trend)}%
                      </span>
                    </div>
                  )}
                  {trendLabel && (
                    <span className="text-xs text-slate-500">{trendLabel}</span>
                  )}
                </div>
              )}
            </div>

            {Icon && (
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}
              >
                <Icon className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
