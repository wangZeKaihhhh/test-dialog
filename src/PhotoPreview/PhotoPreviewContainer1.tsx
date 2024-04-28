import {
  PhotoPreviewContextType,
  PhotoPreviewStore,
} from "./PhotoPreviewProvider";
import GradualImage from "./components/GradualImage";
import classNames from "classnames";
import useFlipOpen from "./hooks/useFlipOpen";
import { useRef } from "react";

interface PhotoPreviewContainerProps extends PhotoPreviewStore {
  updatePreviewInfo: PhotoPreviewContextType["updatePreviewInfo"];
}

const PhotoPreviewContainer1 = (props: PhotoPreviewContainerProps) => {
  const { visible, src, maskSrc, e, updatePreviewInfo, width, height } = props;
  const imgWrapperRef = useRef<HTMLDivElement | null>(null);

  const { close, transformStyle, onTransitionEnd, isEnable, isPlay } =
    useFlipOpen({
      e,
      visible,
      imgWrapperRef,
      updateVisible: (v) =>
        updatePreviewInfo(() => ({
          visible: v,
        })),
    });

  return visible ? (
    <>
      <div
        className={classNames([
          "w-[100vw] h-[100vh] fixed left-0 top-0 bottom-0 right-0 flex justify-center items-center transition-all duration-300!",
          isPlay ? "bg-[rgba(0,0,0,0.45)]" : "bg-[rgba(0,0,0,0)]",
        ])}
        onClick={close}
      />

      <GradualImage
        ref={imgWrapperRef}
        wrapperClassName={classNames([
          "w-[100vw] h-[100vh] fixed left-0 top-0 bottom-0 right-0 m-auto z-1 max-w-full max-h-full",
          {
            "transition-all duration-250 ease-in": isEnable,
          },
        ])}
        // 必须要指定width height
        wrapperStyle={{
          width,
          height,
          ...transformStyle,
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
  ) : null;
};

export default PhotoPreviewContainer1;
