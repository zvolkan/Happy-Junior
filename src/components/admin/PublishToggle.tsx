'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { toggleBlogPublished } from '@/app/actions/blog'

/** Listeden tek tıkla yayına alma / taslağa çekme */
export default function PublishToggle({
  id,
  isPublished,
}: {
  id: string
  isPublished: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    startTransition(async () => {
      const result = await toggleBlogPublished(id)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      title={isPublished ? 'Taslağa çek' : 'Yayına al'}
      className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
        isPublished
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {isPublished ? 'Yayında' : 'Taslak'}
    </button>
  )
}
