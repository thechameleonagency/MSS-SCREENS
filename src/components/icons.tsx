import type { SVGProps } from 'react';

function Icon(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 20, className = '', children, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconHome(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Icon>
  );
}

export function IconSearch(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

export function IconBell(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Icon>
  );
}

/** Bell inside a round stroke — for header notifications */
export function IconBellRound(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10a3 3 0 0 1 6 0c0 3.5 1.75 5.25 1.75 5.25H7.25S9 13.5 9 10z" />
      <path d="M10 18h4" />
    </Icon>
  );
}

export function IconPlus(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

/** Simple map / location pin (universal “pin this” affordance). */
export function IconPin(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <path d="M12 21.5c-2.7-2.15-5-5.35-5-8.75a5 5 0 0 1 10 0c0 3.4-2.3 6.6-5 8.75Z" />
      <circle cx="12" cy="10.5" r="1.75" />
    </Icon>
  );
}

/** Bookmark-style “pin to nav” — clearer than a map pin for saving shortcuts. */
export function IconNavPin(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15l-6-3.5L6 19V4Z" />
    </Icon>
  );
}

export function IconPanel(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="M9 3v18" />
    </Icon>
  );
}

export function IconChevronLeft(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function IconChevronDown(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function IconChevronRight(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export function IconSettings(p: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...p}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}
