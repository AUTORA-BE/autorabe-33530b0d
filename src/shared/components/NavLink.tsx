/**
 * Navigation link with active state indicator and optional badge
 * @module shared/components
 */

import { Link, useLocation } from "react-router-dom";
import { useCallback } from "react";
import { prefetchRoute } from "@/utils/prefetchRoutes";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  badge?: number;
}

const NavLink = ({ to, children, badge }: NavLinkProps) => {
  const location = useLocation();
  const handlePrefetch = useCallback(() => prefetchRoute(to), [to]);

  return (
    <Link
      to={to}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      className={`relative font-medium transition-all duration-200 hover:scale-105 ${
        location.pathname === to
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      {location.pathname === to && (
        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full animate-scale-in" />
      )}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-1 animate-scale-in">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
};

export default NavLink;
