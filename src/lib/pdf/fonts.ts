import { Font } from '@react-pdf/renderer'

// Register Korean fonts (TTF format required)
Font.register({
  family: 'Noto Sans KR',
  src: '/fonts/NotoSansKR-Regular.ttf',
})

Font.register({
  family: 'Noto Sans KR',
  src: '/fonts/NotoSansKR-Bold.ttf',
  fontWeight: 'bold',
})

// Export font constants for use in PDF components
export const fonts = {
  sans: 'Noto Sans KR',
}

export const fontWeights = {
  normal: 400,
  bold: 700,
}
