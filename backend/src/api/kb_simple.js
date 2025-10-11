import express from 'express'

const router = express.Router()

// 获取知识库列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query

    res.json({
      code: 20000,
      data: {
        knowledgeBases: [],
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: 0,
          totalPages: 0
        }
      },
      message: '获取知识库列表成功'
    })
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

export default router






