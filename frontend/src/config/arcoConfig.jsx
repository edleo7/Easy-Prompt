import { ConfigProvider } from '@arco-design/web-react'
import zhCN from '@arco-design/web-react/es/locale/zh-CN'

const arcoGlobalConfig = {
  locale: zhCN,
  theme: {
    primaryColor: '#165dff',
  },
  componentConfig: {
    Message: {
      maxCount: 3,
      duration: 3000,
    },
    Notification: {
      maxCount: 3,
      duration: 3000,
    },
  },
}

export function ArcoProvider({ children }) {
  return (
    <ConfigProvider {...arcoGlobalConfig}>
      {children}
    </ConfigProvider>
  )
}

export default ArcoProvider
