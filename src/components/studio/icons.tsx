import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const TeeIcon = () => (
  <Icon>
    <path d="M8.5 3.5 3 6.5l2 4.5 2.5-1v10.5h9V10l2.5 1 2-4.5-5.5-3a3.6 3.6 0 0 1-7 0Z" fill="currentColor" />
  </Icon>
);

export const BodyIcon = () => (
  <Icon>
    <circle cx="12" cy="4.5" r="2" />
    <path d="M7.5 14V10.5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2V14M9.8 9v12M14.2 9v12M9.8 15h4.4" />
  </Icon>
);

export const FemaleIcon = () => (
  <Icon>
    <circle cx="12" cy="8.5" r="5" />
    <path d="M12 13.5V21M8.5 17.5h7" />
  </Icon>
);

export const MaleIcon = () => (
  <Icon>
    <circle cx="10" cy="14" r="5" />
    <path d="M13.6 10.4 20 4M14.8 4H20v5.2" />
  </Icon>
);

export const ShuffleIcon = () => (
  <Icon>
    <path d="M3 7h3.5c5 0 6 10 11 10H21M3 17h3.5c1.8 0 3-1.3 4-2.9M13.5 9.9c1-1.6 2.2-2.9 4-2.9H21M18 4l3 3-3 3M18 14l3 3-3 3" />
  </Icon>
);

export const ResetIcon = () => (
  <Icon>
    <path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5" />
  </Icon>
);

export const ArrowIcon = () => (
  <Icon>
    <path d="M9 5l7 7-7 7" />
  </Icon>
);
