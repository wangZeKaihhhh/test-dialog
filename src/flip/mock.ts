const generateTestData = (
  count: number
): { thumbnail: string; fullImage: string }[] => {
  const testData = []
  for (let i = 0; i < count; i++) {
    const thumbnail = `https://picsum.photos/id/${i + 1}/150/150`
    const fullImage = `https://picsum.photos/id/${i + 1}/600/600`
    testData.push({ thumbnail, fullImage })
  }
  return testData
}

// 生成 10 条测试数据
export const testPhotos = generateTestData(10)
