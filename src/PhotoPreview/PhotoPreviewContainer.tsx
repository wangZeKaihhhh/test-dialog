import { useRef, useState, useLayoutEffect } from "react"
import classNames from "classnames"
import {
  PhotoPreviewStore,
  PhotoPreviewContextType,
} from "./PhotoPreviewProvider"
import GradualImage from "./components/GradualImage"

type PreviewVisibleStatus = "show" | "closing" | "closed"
type FlipStatus = "first" | "last" | "invert" | "play"

interface PhotoPreviewContainerProps extends PhotoPreviewStore {
  updatePreviewInfo: PhotoPreviewContextType["updatePreviewInfo"]
}

const initialDomRect = {
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as DOMRect

const PhotoPreviewContainer = (props: PhotoPreviewContainerProps) => {
  const { src: currentImage, e, visible, updatePreviewInfo, maskSrc } = props
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

  const onTransitionEnd = () => {
    console.log("onTransitionEnd", previewVisibleStatus.current)

    if (previewVisibleStatus.current === "closing") {
      previewVisibleStatus.current = "closed"
      setFlipStatus("first")
      updatePreviewInfo({ src: "", maskSrc: "", e: void 0, visible: false })
    }
  }

  if (visible && previewVisibleStatus.current === "closed") {
    previewVisibleStatus.current = "show"
  }

  useLayoutEffect(() => {
    if (!e) return
    console.log("useLayoutEffect")

    if (flipStatus === "first" && previewVisibleStatus.current === "show") {
      const currentPreviewEle = e.target as HTMLElement
      firstRect.current = currentPreviewEle.getBoundingClientRect()
      setFlipStatus("last")
    } else if (flipStatus === "last") {
      if (previewVisibleStatus.current === "show") {
        console.log(imgRef.current)

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
  }, [flipStatus, currentImage, e])

  console.log({
    flipStatus,
    props,
    previewVisibleStatus: previewVisibleStatus.current,
    firstRect: firstRect.current,
    lastRect: lastRect.current,
  })

  return previewVisibleStatus.current === "show" ||
    previewVisibleStatus.current === "closing" ? (
    <>
      <div
        className="fixed left-0 top-0 bottom-0 right-0 bg-black opacity-50 z-1 flex justify-center items-center transition-all duration-300!"
        style={{
          opacity:
            flipStatus === "play" && previewVisibleStatus.current !== "closing"
              ? 0.45
              : 0,
        }}
        onClick={() => {
          previewVisibleStatus.current = "closing"
          setFlipStatus("last")
          updatePreviewInfo((draft) => {
            draft.visible = false
          })
        }}
      />

      <GradualImage
        ref={imgRef}
        maskAttr={{
          src: maskSrc,
          className: classNames([
            "fixed left-0 top-0 bottom-0 right-0 m-auto z-2 max-w-full max-h-full w-800px h-600px",
            {
              "transition-all duration-400! ease-in-out":
                (previewVisibleStatus.current === "show" &&
                  flipStatus === "play") ||
                previewVisibleStatus.current === "closing",
            },
          ]),
          style: {
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
          },
          onTransitionEnd,
        }}
        className={classNames([
          "fixed left-0 top-0 bottom-0 right-0 m-auto max-w-full max-h-full z-3",
        ])}
        src={currentImage}
      />
    </>
  ) : null
}

export default PhotoPreviewContainer
