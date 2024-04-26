export const mockImages: string[] = []

const getRandomImges = () => {
  // Generate 100 image links
  for (let i = 0; i < 100; i++) {
    const imageNumber = Math.floor(Math.random() * 1000) // Generate a random number for image ID
    const imageUrl = `https://source.unsplash.com/random/400x300?sig=${imageNumber}` // Adjust size and base URL as needed
    mockImages.push(imageUrl)
  }
}

getRandomImges()

const generateData = (size: number) => {
  // 获取在 200-900之间的随机整数
  function getSize() {
    return Math.round(Math.random() * 700 + 200)
  }
  // 生成随机 16进制颜色
  function color16() {
    return ((Math.random() * 0x1000000) << 0).toString(16)
  }

  return Array(size)
    .fill(0)
    .map(() => {
      const width = getSize()
      const height = getSize()
      // return {
      //   width,
      //   height,
      //   src: `https://dummyimage.com/${width}x${height}/${color16()}`,
      // }
      return `https://dummyimage.com/${width}x${height}/${color16()}`
    })
}

// 生成随机尺寸的图片
export const mockPictures = generateData(10)
