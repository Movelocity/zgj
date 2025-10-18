import { useRef, useState } from 'react'

export const useHover = () => {
  const [isHoverOpen, setIsHoverOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  

  const handleMouseEnter = () => {
    setIsHoverOpen(true)
    // 总是先清除之前的timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }
  const handleMouseLeave = () => {
    // 清除任何pending的timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    // 设置新的timeout
    timeoutRef.current = setTimeout(() => {
      setIsHoverOpen(false)
      timeoutRef.current = null
    }, 300)
  }

  return { isHoverOpen, handleMouseEnter, handleMouseLeave, setIsHoverOpen }
}