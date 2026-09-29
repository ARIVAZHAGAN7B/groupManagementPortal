import React from "react";

export const Card = ({
  children,
  className = "",
  padding = "p-5 md:p-6",
  variant = "default", // default | elevated | subtle
  onClick,
  ...props
}) => {
  const variantStyles = {
    default:
      "border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900",
    elevated:
      "border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none",
    subtle:
      "border border-slate-100 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-800/40"
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-colors duration-150 ${variantStyles[variant] || variantStyles.default} ${padding} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  title,
  subtitle,
  action,
  className = "",
  titleClassName = "text-base font-bold text-slate-900 dark:text-slate-100",
  subtitleClassName = "text-xs text-slate-500 dark:text-slate-400 mt-0.5"
}) => (
  <div className={`flex items-start justify-between gap-4 pb-4 ${className}`}>
    <div>
      {title && <h3 className={titleClassName}>{title}</h3>}
      {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default Card;
