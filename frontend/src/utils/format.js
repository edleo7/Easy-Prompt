/**
 * 格式化工具函数
 */

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期
 */
export const formatDate = (date) => {
  if (!date) return '-'
  
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }
  
  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }
  
  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }
  
  // 超过7天，显示具体日期
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 格式化相对时间
 * @param {string|Date} date - 日期
 * @returns {string} 相对时间
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-'
  
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })
  
  if (diff < 60 * 1000) {
    return '刚刚'
  } else if (diff < 60 * 60 * 1000) {
    return rtf.format(-Math.floor(diff / (60 * 1000)), 'minute')
  } else if (diff < 24 * 60 * 60 * 1000) {
    return rtf.format(-Math.floor(diff / (60 * 60 * 1000)), 'hour')
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    return rtf.format(-Math.floor(diff / (24 * 60 * 60 * 1000)), 'day')
  } else {
    return d.toLocaleDateString('zh-CN')
  }
}

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} 截断后的文本
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + suffix
}

/**
 * 格式化数字
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
export const formatNumber = (num) => {
  if (!num || num === 0) return '0'
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  
  return num.toString()
}

/**
 * 格式化百分比
 * @param {number} value - 值
 * @param {number} total - 总数
 * @param {number} decimals - 小数位数
 * @returns {string} 百分比
 */
export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%'
  return ((value / total) * 100).toFixed(decimals) + '%'
}

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期时间
 */
export const formatDateTime = (date) => {
  if (!date) return '-'
  
  const d = new Date(date)
  
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
