/**
 * iOS-style settings section: titled card with rows separated by indented dividers.
 * @module features/settings/components
 */

import { motion } from "framer-motion";
import { Children, isValidElement, Fragment } from "react";

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 30 } },
};

interface Props {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({ title, footer, children, className = "" }: Props) {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <motion.section variants={item} className={`space-y-2 ${className}`}>
      {title && (
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] px-4">
          {title}
        </h3>
      )}
      <div className="rounded-[14px] bg-card/60 backdrop-blur-xl border border-border/30 shadow-sm shadow-foreground/[0.02] px-3 overflow-hidden">
        {rows.map((child, i) => (
          <Fragment key={i}>
            {child}
            {i < rows.length - 1 && (
              <div className="h-px bg-border/40 ml-[40px]" />
            )}
          </Fragment>
        ))}
      </div>
      {footer && (
        <p className="text-[11px] text-muted-foreground px-4 leading-relaxed">{footer}</p>
      )}
    </motion.section>
  );
}

export default SettingsSection;
