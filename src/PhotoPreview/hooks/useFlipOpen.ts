import { CSSProperties, useLayoutEffect, useRef, useState } from "react";
import { PhotoPreviewStore } from "../PhotoPreviewProvider";
type FlipStatus = "first" | "last" | "invert" | "play";
type FlipFlag = "enter" | "out";

const initialDomRect = {
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as DOMRect;

const useFlipOpen = ({
  e,
  visible,
  updateVisible,
  imgWrapperRef,
}: {
  e: PhotoPreviewStore["e"];
  visible: boolean;
  imgWrapperRef: React.MutableRefObject<HTMLDivElement | null>;
  updateVisible: (v: boolean) => void;
}) => {
  // FLIP状态
  const [flipStatus, setFlipStatus] = useState<FlipStatus>("first");
  // 标记动画进入/退出
  const flipFlag = useRef<FlipFlag>("enter");
  // First状态
  const firstRect = useRef<DOMRect>(initialDomRect);
  // Last状态
  const lastRect = useRef<DOMRect>(initialDomRect);
  // 缩放比例
  const scaleValue = useRef<number>(1);

  const getFlipRect = (e: PhotoPreviewStore["e"]) => {
    const target = e?.target as HTMLElement;
    const first = target?.getBoundingClientRect() ?? initialDomRect;
    const last =
      imgWrapperRef?.current?.getBoundingClientRect() ?? initialDomRect;

    return {
      first,
      last,
    };
  };

  const onTransitionEnd = () => {
    if (flipFlag.current === "out") {
      updateVisible(false);
      flipFlag.current = "enter";
      setFlipStatus("first");
    }
  };

  const close = () => {
    flipFlag.current = "out";
    setFlipStatus("invert");
  };

  useLayoutEffect(() => {
    if (!e || !visible) return;

    if (flipStatus === "first") {
      const { first, last } = getFlipRect(e);
      firstRect.current = first;
      lastRect.current = last;
      scaleValue.current = firstRect.current.width / lastRect.current.width;
      setFlipStatus("invert");
    } else if (flipStatus === "invert") {
      flipFlag.current === "enter" &&
        setTimeout(() => {
          setFlipStatus("play");
        }, 10);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e, flipStatus, visible]);

  const offsetX = firstRect.current.left - lastRect.current.left;
  const offsetY = firstRect.current.top - lastRect.current.top;
  const transformStyle = {
    transform:
      flipStatus === "invert"
        ? `translate3d(${offsetX}px,${offsetY}px,0) scale(${scaleValue.current})`
        : "translate3d(0,0,0) scale(1)",
    transformOrigin: "0 0",
  } as CSSProperties;
  const isEnable =
    flipStatus === "play" ||
    (flipFlag.current === "out" && flipStatus === "invert");
  const isPlay = flipStatus === "play";

  return {
    imgWrapperRef,
    onTransitionEnd,
    close,
    transformStyle,
    isEnable,
    isPlay,
  };
};

export default useFlipOpen;
