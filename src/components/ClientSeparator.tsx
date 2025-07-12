"use client"

import { Separator } from "./ui/separator";

interface ClientSeparatorProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export default function ClientSeparator({ className, orientation }: ClientSeparatorProps) {
  return <Separator className={className} orientation={orientation} />;
}