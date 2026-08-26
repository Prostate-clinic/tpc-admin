"use client";

import Image from "next/image";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
};

export default function Avatar({ src, name, size = 40, className = "" }: AvatarProps) {
  const fontSize = size <= 32 ? "text-xs" : size <= 48 ? "text-sm" : "text-base";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={name} fill unoptimized className="object-cover" sizes={`${size}px`} />
      ) : (
        <span className={`flex h-full w-full items-center justify-center font-semibold text-slate-500 ${fontSize}`}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
