import React, { MouseEvent } from "react"
import "./styles.css"

interface ListDataItem {
  width: number
  height: number
  bgPic: string
}

// 标识预览的状态，1：显示，2：开始关闭，3：已关闭
let previewVisibleStatus: "show" | "closing" | "closed" = "closed"
// 当前预览的元素
let currentPreviewEle: HTMLElement | null = null
// 记录动画起始状态的元素位置信息，left, top
const previewFirstRect: [DOMRect["left"], DOMRect["top"]] = [0, 0]
const previewLastRect: [DOMRect["left"], DOMRect["top"]] = [0, 0]
// 临时记录位置信息
let rectInfo: DOMRect | null = null
// First与Last两个状态之间的缩放比例
let scaleValue = 1
// 生成初始测试数据
const listData: ListDataItem[] = Array(10)
  .fill(0)
  .map(() => {
    const width = getSize()
    const height = getSize()
    return {
      width,
      height,
      bgPic: `https://dummyimage.com/${width}x${height}/${color16()}`,
    }
  })

// 获取在 200-900之间的随机整数
function getSize() {
  return Math.round(Math.random() * 700 + 200)
}
// 生成随机 16进制颜色
function color16() {
  return ("00000" + ((Math.random() * 0x1000000) << 0).toString(16)).substr(-6)
}

/**
 * @deprecated
 */
class PhotoPreview extends React.Component {
  previewRef = React.createRef()
  state = {
    // First Last Invert Play
    previewStatus: 0,
    previewImgInfo: null,
  }
  componentDidUpdate() {
    // card 预览
    this.updatePreviewStatus()
  }
  updatePreviewStatus() {
    if (this.state.previewStatus === 1) {
      // Last + Invert
      if (previewVisibleStatus === "show") {
        const lastRectInfo = this.previewRef.current.getBoundingClientRect()
        previewLastRect[0] = lastRectInfo.left
        previewLastRect[1] = lastRectInfo.top
        scaleValue = rectInfo.width / lastRectInfo.width
      }
      this.setState({
        previewStatus: 2,
      })
    } else if (this.state.previewStatus === 2) {
      // Play
      setTimeout(() => {
        this.setState({
          previewStatus: 3,
        })
      }, 0)
    }
  }
  previewItem(
    status: typeof previewVisibleStatus,
    previewImgInfo: null | ListDataItem = null,
    e: MouseEvent
  ) {
    previewVisibleStatus = status
    if (previewVisibleStatus === "show") {
      currentPreviewEle = e.target as HTMLElement
      // 获取First状态
      rectInfo = currentPreviewEle.getBoundingClientRect()

      previewFirstRect[0] = rectInfo.left
      previewFirstRect[1] = rectInfo.top

      this.setState({
        previewImgInfo,
        previewStatus: 1,
      })
    } else {
      this.setState({
        previewStatus: 1,
      })
    }
  }

  transEnd() {
    if (previewVisibleStatus === "closing") {
      previewVisibleStatus = "closed"
      this.setState({
        previewStatus: 0,
      })
    }
  }

  render() {
    const { previewStatus, previewImgInfo } = this.state
    return (
      <>
        <ul>
          {listData.map((item, index) => (
            <li
              key={index}
              className="pic-item"
              onClick={this.previewItem.bind(this, "show", item)}
              title="点击预览"
            >
              <img src={item.bgPic} alt="" className="w-full h-full" />
            </li>
          ))}
        </ul>

        {previewVisibleStatus === "show" ||
        previewVisibleStatus === "closing" ? (
          <>
            <div
              className="preview-box"
              onClick={this.previewItem.bind(this, "closing")}
              style={{
                opacity:
                  // Play
                  previewStatus === 3 && previewVisibleStatus !== "closing"
                    ? 0.45
                    : 0,
              }}
            ></div>
            <img
              ref={this.previewRef}
              className={`img${
                (previewStatus === 3 && previewVisibleStatus === "show") ||
                previewVisibleStatus === "closing"
                  ? " active"
                  : ""
              }`}
              src={previewImgInfo.bgPic}
              style={{
                transform:
                  previewStatus === 2 || previewVisibleStatus === "closing"
                    ? `translate3d(${
                        previewFirstRect[0] - previewLastRect[0]
                      }px, ${
                        previewFirstRect[1] - previewLastRect[1]
                      }px, 0) scale(${scaleValue})`
                    : "translate3d(0, 0, 0) scale(1)",
                transformOrigin: "0 0",
              }}
              onClick={this.previewItem.bind(this, "closed")}
              onTransitionEnd={this.transEnd.bind(this)}
              alt=""
            />
          </>
        ) : null}
      </>
    )
  }
}
