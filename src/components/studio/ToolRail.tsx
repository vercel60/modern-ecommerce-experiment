"use client";

import styles from "./ToolRail.module.css";
import { BodyIcon, ResetIcon, ShuffleIcon, TeeIcon } from "./icons";

interface Props {
  fullLook: boolean;
  onFullLook: (value: boolean) => void;
  onShuffle: () => void;
  onReset: () => void;
}

export function ToolRail({ fullLook, onFullLook, onShuffle, onReset }: Props) {
  return (
    <div className={styles.rail} role="toolbar" aria-label="Fitting room" aria-orientation="vertical" data-ui data-cursor="none">
      <button type="button" aria-pressed={!fullLook} aria-label="Focus on category" title="Focus" onClick={() => onFullLook(false)}>
        <TeeIcon />
      </button>
      <button type="button" aria-pressed={fullLook} aria-label="Show full look" title="Full look" onClick={() => onFullLook(true)}>
        <BodyIcon />
      </button>
      <button type="button" aria-label="Shuffle outfit" title="Shuffle" onClick={onShuffle}>
        <ShuffleIcon />
      </button>
      <button type="button" aria-label="Reset outfit" title="Reset" onClick={onReset}>
        <ResetIcon />
      </button>
    </div>
  );
}
