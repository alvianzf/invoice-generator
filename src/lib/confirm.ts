import { createContext, ReactNode, useContext } from "react";

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** "danger" for destructive actions such as deleting or discarding work. */
  tone?: "danger" | "default";
}

export type Confirm = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<Confirm | null>(null);

/** Resolves true when the user confirms, false on cancel, Esc or a backdrop click. */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}
