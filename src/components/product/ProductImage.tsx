'use client'

import { useState } from 'react'
import Image from 'next/image'
import Icon, { type IconName } from '@/components/ui/Icon'

interface Props {
  src: string
  alt: string
  fallback?: IconName
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
}

export default function ProductImage({ src, alt, fallback = 'paket', className, fill, sizes, priority }: Props) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <Icon name={fallback} className="w-20 h-20 text-gray-300" />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setError(true)}
    />
  )
}
