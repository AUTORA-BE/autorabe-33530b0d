/**
 * Navigation link with active state indicator and optional badge
 * @module shared/components
 */

import { forwardRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCallback } from "react";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { useLocalizedHref } from "@/lib/useLocalizedHref";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  badge?: number;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({ to, children, badge }, ref) => {
  const location = useLocation();
  const localized = useLocalizedHref();
  const finalTo = localized(to);
  const handlePrefetch = useCallback(() => prefetchRoute(to), [to]);
  const isActive = location.pathname === finalTo || location.pathname === to;

  return (
    <Link
      ref={ref}
      to={finalTo}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      className={`relative font-medium transition-all duration-200 hover:scale-105 link-hover ${
        isActive
          ? "text-primary"
          : "text-foreground/80 hover:text-foreground"
      }`}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full animate-scale-in" />
      )}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-1 animate-scale-in">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
});

NavLink.displayName = "NavLink";

export default NavLink;
