import {
  CSSProperties,
  forwardRef,
  type ImgHTMLAttributes,
  type TransitionEventHandler,
} from "react"

interface GradualImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  maskAttr?: ImgHTMLAttributes<HTMLImageElement>
  wrapperClassName?: string
  wrapperStyle?: CSSProperties
  onTransitionEnd?: TransitionEventHandler<HTMLDivElement>
}

const GradualImage = forwardRef<HTMLDivElement, GradualImageProps>(
  (props, ref) => {
    const {
      maskAttr,
      wrapperClassName,
      wrapperStyle,
      onTransitionEnd,
      ...other
    } = props

    return (
      <div
        ref={ref}
        style={wrapperStyle}
        className={wrapperClassName}
        onTransitionEnd={onTransitionEnd}
      >
        <img alt="mask-image" {...maskAttr} />
        <img alt="original-image" {...other} />
      </div>
    )
  }
)

export default GradualImage
