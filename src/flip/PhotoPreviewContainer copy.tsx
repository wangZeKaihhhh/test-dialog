import { useRef, useState, MouseEvent, useLayoutEffect } from "react"
import { mockImages } from "./mock"
import classNames from "classnames"

type PreviewVisibleStatus = "show" | "closing" | "closed"
type FlipStatus = "first" | "last" | "invert" | "play"

const initialDomRect = {
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as DOMRect

const PhotoPreview = () => {
  // 当前的预览图片
  const [currentImage, setCurrentImage] = useState<string>("")
  // Flip状态
  const [flipStatus, setFlipStatus] = useState<FlipStatus>("first")

  // 标识预览的状态，show：显示，closing：开始关闭，closed：已关闭
  const previewVisibleStatus = useRef<PreviewVisibleStatus>("closed")
  // First状态
  const firstRect = useRef<DOMRect>(initialDomRect)
  // Last状态
  const lastRect = useRef<DOMRect>(initialDomRect)
  // 缩放比例
  const scaleValue = useRef<number>(1)

  const imgRef = useRef<HTMLImageElement | null>(null)

  // 预览图片: 记录First状态
  const previewItem = (
    status: PreviewVisibleStatus,
    src: string,
    e: MouseEvent
  ) => {
    previewVisibleStatus.current = status
    if (previewVisibleStatus.current === "show") {
      const currentPreviewEle = e.target as HTMLElement
      firstRect.current = currentPreviewEle.getBoundingClientRect()
      setCurrentImage(src)
      setFlipStatus("last")
    } else {
      setFlipStatus("last")
    }
  }

  const onTransitionEnd = () => {
    if (previewVisibleStatus.current === "closing") {
      previewVisibleStatus.current = "closed"
      setFlipStatus("first")
      setCurrentImage("")
    }
  }

  useLayoutEffect(() => {
    if (flipStatus === "last") {
      if (previewVisibleStatus.current === "show") {
        if (!imgRef.current) return

        lastRect.current = currentImage
          ? imgRef.current?.getBoundingClientRect()
          : initialDomRect

        scaleValue.current = firstRect.current.width / lastRect.current.width
      }
      setFlipStatus("invert")
    } else if (flipStatus === "invert") {
      setTimeout(() => {
        setFlipStatus("play")
      }, 10)
    }
  }, [flipStatus, currentImage])

  return (
    <>
      <ul className="p0 list-none m0">
        {mockImages.map((src, index) => (
          <li
            key={src + index}
            className="relative inline-block w-100px overflow-hidden"
            onClick={(e) => previewItem("show", src, e)}
            title="点击预览"
          >
            <img src={src} alt="" className="w-full h-full" />
          </li>
        ))}
      </ul>

      {previewVisibleStatus.current === "show" ||
      previewVisibleStatus.current === "closing" ? (
        <>
          <div
            className="fixed left-0 top-0 bottom-0 right-0 bg-black opacity-50 z-1 transition-all duration-300!"
            style={{
              opacity:
                flipStatus === "play" &&
                previewVisibleStatus.current !== "closing"
                  ? 0.45
                  : 0,
            }}
            onClick={(e) => previewItem("closing", "", e)}
          />

          <img
            ref={imgRef}
            className={classNames([
              "fixed left-0 top-0 bottom-0 right-0 m-auto max-w-full max-h-full z-2",
              {
                "transition-all duration-400! ease-in-out":
                  (previewVisibleStatus.current === "show" &&
                    flipStatus === "play") ||
                  previewVisibleStatus.current === "closing",
              },
            ])}
            src={currentImage}
            style={{
              transform:
                flipStatus === "invert" ||
                previewVisibleStatus.current === "closing"
                  ? `translate3d(${
                      firstRect.current.left - lastRect.current.left
                    }px,${
                      firstRect.current.top - lastRect.current.top
                    }px,0) scale(${scaleValue.current})`
                  : "translate3d(0,0,0) scale(1)",
              transformOrigin: "0 0",
            }}
            onTransitionEnd={onTransitionEnd}
            alt=""
          />
        </>
      ) : null}
    </>
  )
}

export default PhotoPreview
