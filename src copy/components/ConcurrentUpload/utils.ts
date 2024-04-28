/**
 * 格式化任务剩余完成时间
 * @param milliseconds 时间 单位ms
 */
// TODO 待完善
export const formatRemainingTime = (milliseconds: number) => {
  const minFormat = (value: number) => (value >= 0 ? value : 0);

  const seconds = minFormat(Math.ceil(Number(milliseconds) / 1000));
  const minutes = minFormat(Math.floor(seconds / 60));
  const remainingSeconds = minFormat(seconds % 60);

  if (minutes >= 1) {
    return `${minutes} 分钟 ${remainingSeconds} 秒`;
  } else {
    return `${remainingSeconds} 秒`;
  }
};
