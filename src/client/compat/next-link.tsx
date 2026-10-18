import React from "react";
import { Link as WouterLink } from "wouter";

export interface NextLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children?: React.ReactNode;
}

export default function Link({ href, children, ...rest }: NextLinkProps) {
  return (
    <WouterLink href={href} {...rest}>
      {children}
    </WouterLink>
  );
}
