"use client";
import { useEffect, useRef, type ReactNode } from "react";
/** Native world services share Grace's browser frame without navigating the world. */
export function GraceWorldPanel({
  address,
  onClose,
  children,
}: {
  address: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-label={`Grace · ${address}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto h-[calc(100dvh-40px)] max-h-none w-[calc(100vw-40px)] max-w-6xl overflow-hidden rounded-2xl border border-[#b39ac7] bg-[#fbf4e2] p-0 text-[#30213e] shadow-2xl backdrop:bg-[#17102070] max-sm:h-dvh max-sm:w-screen max-sm:rounded-none"
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center justify-between bg-[#292035] px-4 py-3 text-[#fff4df]">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-[#6b3fa0] font-serif text-3xl italic text-[#f3d291]">
              g
            </span>
            <b className="font-serif text-2xl">Grace</b>
            <span className="ml-3 hidden text-[10px] font-bold tracking-widest text-[#d0bade] sm:inline">
              THE KAIROS WORLD WEB
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Grace service"
            className="grid size-10 place-items-center rounded-lg border border-[#947ba1] text-2xl hover:bg-white/10"
          >
            ×
          </button>
        </header>
        <div className="shrink-0 border-b border-[#d7c5dd] bg-[#eee4ec] p-2">
          <div className="rounded-lg border border-[#d4c0de] bg-[#fffaf1] px-4 py-2 text-xs font-bold text-[#745387]">
            grace://{address}
          </div>
        </div>
        <div className="relative min-h-0 flex-1 overflow-auto">{children}</div>
        <footer className="shrink-0 border-t border-[#d7c5dd] bg-[#eee4ec] px-4 py-2 text-[11px] text-[#6d557c]">
          Grace · Return to your world when you’re ready.
        </footer>
      </div>
    </dialog>
  );
}
