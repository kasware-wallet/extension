import { useEffect, RefObject } from 'react'

function useInfiniteScroll(
  loadingMore: boolean,
  loadMore: () => void,
  lastElementRef: RefObject<HTMLElement>,
) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        const lastEntry = entries[0]
        if (lastEntry.isIntersecting && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 1.0 },
    )

    if (lastElementRef.current) {
      observer.observe(lastElementRef.current)
    }

    return () => {
      if (lastElementRef.current) {
        observer.unobserve(lastElementRef.current)
      }
    }
  }, [loadingMore, loadMore, lastElementRef])
}

export default useInfiniteScroll
