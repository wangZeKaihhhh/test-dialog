import { useEffect, useRef } from "react"

const usePhotoCache = (
  activeIndex: number,
  photos: string[],
  cacheCount = 3
) => {
  const cache = useRef(new Map())
  const activePhoto = useRef(photos[activeIndex] ?? "")

  useEffect(() => {
    const cachedIndexes = Array.from(cache.current.keys())
    const missingIndexes = []
    for (let i = activeIndex - cacheCount; i <= activeIndex + cacheCount; i++) {
      if (!cachedIndexes.includes(i) && i >= 0 && i < photos.length) {
        missingIndexes.push(i)
      }
    }
    missingIndexes.forEach((index) => {
      const img = new Image()
      img.src = photos[index]
      cache.current.set(index, img)
    })
  }, [activeIndex, photos, cacheCount])

  return {
    cache,
    activePhoto,
  }
}

export default usePhotoCache
