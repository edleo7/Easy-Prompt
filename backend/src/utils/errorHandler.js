export const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', err)

  // Prisma 错误处理
  if (err.code === 'P2002') {
    return res.status(400).json({
      code: 400,
      message: '数据已存在',
      data: null
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      code: 404,
      message: '记录不存在',
      data: null
    })
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '认证令牌无效',
      data: null
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: '认证令牌已过期',
      data: null
    })
  }

  // 默认错误处理
  const statusCode = err.statusCode || 500
  const message = err.message || '服务器内部错误'

  res.status(statusCode).json({
    code: statusCode,
    message,
    data: null
  })
}
