export const createCubeTexturePathStrings = (filename: string, basePath: string, fileType: string) => {
  const baseFilename = basePath + filename
  const sides = ["ft", "bk", "up", "dn", "rt", "lf"]

  const pathStings = sides.map(side => {
    return baseFilename + "_" + side + '.' + fileType
  })
  return pathStings
}