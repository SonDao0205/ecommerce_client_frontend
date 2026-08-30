"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useDebouncedCallback } from "@/src/hooks/use-debounced-callback";

type DebouncedProductLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export function DebouncedProductLink({ href, onClick, ...props }: DebouncedProductLinkProps) {
  const router = useRouter();
  const navigate = useDebouncedCallback(() => router.push(href), 250);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate();
  }

  return <Link {...props} href={href} onClick={handleClick} />;
}
