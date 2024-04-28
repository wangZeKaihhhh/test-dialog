import { useLayoutEffect, useRef, useState } from "react"
import {
  PhotoPreviewContextType,
  PhotoPreviewStore,
} from "./PhotoPreviewProvider"
import GradualImage from "./components/GradualImage"
import classNames from "classnames"

interface PhotoPreviewContainerProps extends PhotoPreviewStore {
  updatePreviewInfo: PhotoPreviewContextType["updatePreviewInfo"]
}

type FlipStatus = "first" | "last" | "invert" | "play"
type FlipFlag = "enter" | "out"

const initialDomRect = {
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as DOMRect

const PhotoPreviewContainer1 = (props: PhotoPreviewContainerProps) => {
  const { visible, src, maskSrc, e, updatePreviewInfo, width, height } = props
  // FLIP状态
  const [flipStatus, setFlipStatus] = useState<FlipStatus>("first")
  // 标记动画进入/退出
  const flipFlag = useRef<FlipFlag>("enter")
  // First状态
  const firstRect = useRef<DOMRect>(initialDomRect)
  // Last状态
  const lastRect = useRef<DOMRect>(initialDomRect)
  // 缩放比例
  const scaleValue = useRef<number>(1)

  const imgWrapperRef = useRef<HTMLDivElement | null>(null)

  const getFlipRect = (e: PhotoPreviewStore["e"]) => {
    const target = e?.target as HTMLElement
    const first = target?.getBoundingClientRect() ?? initialDomRect
    const last =
      imgWrapperRef?.current?.getBoundingClientRect() ?? initialDomRect

    return {
      first,
      last,
    }
  }

  const onTransitionEnd = () => {
    if (flipFlag.current === "out") {
      updatePreviewInfo(() => ({ visible: false }))
      flipFlag.current = "enter"
      setFlipStatus("first")
    }
  }

  useLayoutEffect(() => {
    if (!e || !visible) return

    if (flipStatus === "first") {
      const { first, last } = getFlipRect(e)
      firstRect.current = first
      lastRect.current = last
      scaleValue.current = firstRect.current.width / lastRect.current.width
      setFlipStatus("invert")
    } else if (flipStatus === "invert") {
      flipFlag.current === "enter" &&
        setTimeout(() => {
          setFlipStatus("play")
        }, 10)
    }
  }, [e, flipStatus, updatePreviewInfo, visible])

  const offsetX = firstRect.current.left - lastRect.current.left
  const offsetY = firstRect.current.top - lastRect.current.top

  return visible ? (
    <>
      <div
        className={classNames([
          "w-[100vw] h-[100vh] fixed left-0 top-0 bottom-0 right-0 flex justify-center items-center transition-all duration-300!",
          flipStatus === "play"
            ? "bg-[rgba(0,0,0,0.45)]"
            : "bg-[rgba(0,0,0,0)]",
        ])}
        onClick={() => {
          flipFlag.current = "out"
          setFlipStatus("invert")
        }}
      />

      <GradualImage
        ref={imgWrapperRef}
        wrapperClassName={classNames([
          "w-[100vw] h-[100vh] fixed left-0 top-0 bottom-0 right-0 m-auto z-1 max-w-full max-h-full",
          {
            "transition-all duration-250 ease-in":
              flipStatus === "play" ||
              (flipFlag.current === "out" && flipStatus === "invert"),
          },
        ])}
        // 必须要指定width height
        wrapperStyle={{
          width,
          height,
          transform:
            flipStatus === "invert"
              ? `translate3d(${offsetX}px,${offsetY}px,0) scale(${scaleValue.current})`
              : "translate3d(0,0,0) scale(1)",
          transformOrigin: "0 0",
        }}
        maskAttr={{
          src: maskSrc,
          style: {
            width,
            height,
          },
          className: "fixed left-0 top-0 bottom-0 right-0 m-auto z-2",
        }}
        src={src}
        className="fixed left-0 top-0 bottom-0 right-0 m-auto z-3"
        onTransitionEnd={onTransitionEnd}
      />
    </>
  ) : null
}

export default PhotoPreviewContainer1
