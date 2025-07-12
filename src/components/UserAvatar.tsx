"use client"

import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  className?: string
}

export default function UserAvatar({ src, name, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={src || "/avatar.png"} />
      <AvatarFallback>
        {name?.charAt(0)?.toUpperCase() || "U"}
      </AvatarFallback>
    </Avatar>
  )
}