import express from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { getCloudStorageService } from '../services/cloudStorage.js'
import { getMultimodalParser } from '../services/multimodalParser.js'

const router = express.Router()
const prisma = new PrismaClient()

// 文件上传临时存储配置
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
})

// ==================== 知识库管理接口 ====================

// 获取知识库列表（卡片展示）
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search = '', workspaceId } = req.query
    const skip = (page - 1) * pageSize

    const where = {
      ...(workspaceId && { workspaceId }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } }
        ]
      })
    }

    const [knowledgeBases, total] = await Promise.all([
      prisma.knowledgeBase.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        include: {
          workspace: {
            select: { id: true, name: true }
          },
          _count: {
            select: { files: true, folders: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.knowledgeBase.count({ where })
    ])

    res.json({
      code: 200,
      data: {
        knowledgeBases: knowledgeBases.map(kb => ({
          ...kb,
          tags: kb.tags ? JSON.parse(kb.tags) : [],
          collaborators: kb.collaborators ? JSON.parse(kb.collaborators) : [],
          fileCount: kb._count.files,
          folderCount: kb._count.folders
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      },
      message: '获取知识库列表成功'
    })
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '服务异常'
    })
  }
})

// 创建知识库
router.post('/', async (req, res) => {
  try {
    const { name, description, coverImage, tags = [], workspaceId } = req.body

    if (!name || !workspaceId) {
      return res.status(400).json({
        code: 400,
        message: '知识库名称和工作空间ID不能为空',
        data: null
      })
    }

    const knowledgeBase = await prisma.knowledgeBase.create({
      data: {
        name,
        description,
        coverImage,
        tags: JSON.stringify(tags),
        collaborators: JSON.stringify([]),
        workspaceId
      }
    })

    res.status(201).json({
      code: 201,
      data: {
        ...knowledgeBase,
        tags: JSON.parse(knowledgeBase.tags || '[]'),
        collaborators: JSON.parse(knowledgeBase.collaborators || '[]')
      },
      message: '知识库创建成功'
    })
  } catch (error) {
    console.error('创建知识库失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '创建知识库失败'
    })
  }
})

// 获取知识库详情（含文件夹树）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        folders: {
          include: {
            files: true,
            children: {
              include: {
                files: true
              }
            }
          },
          where: {
            parentId: null // 只获取根文件夹
          }
        },
        files: {
          where: {
            folderId: null // 只获取未分类的文件
          }
        }
      }
    })

    if (!knowledgeBase) {
      return res.status(404).json({
        code: 404,
        message: '知识库不存在',
        data: null
      })
    }

    res.json({
      code: 200,
      data: {
        ...knowledgeBase,
        tags: JSON.parse(knowledgeBase.tags || '[]'),
        collaborators: JSON.parse(knowledgeBase.collaborators || '[]')
      },
      message: '获取知识库详情成功'
    })
  } catch (error) {
    console.error('获取知识库详情失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取知识库详情失败'
    })
  }
})

// 更新知识库
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, coverImage, tags } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (tags !== undefined) updateData.tags = JSON.stringify(tags)

    const knowledgeBase = await prisma.knowledgeBase.update({
      where: { id },
      data: updateData
    })

    res.json({
      code: 200,
      data: {
        ...knowledgeBase,
        tags: JSON.parse(knowledgeBase.tags || '[]'),
        collaborators: JSON.parse(knowledgeBase.collaborators || '[]')
      },
      message: '知识库更新成功'
    })
  } catch (error) {
    console.error('更新知识库失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '更新知识库失败'
    })
  }
})

// 删除知识库
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 删除知识库及其所有关联数据
    await prisma.$transaction([
      prisma.docChunk.deleteMany({
        where: {
          file: {
            kbId: id
          }
        }
      }),
      prisma.file.deleteMany({
        where: { kbId: id }
      }),
      prisma.folder.deleteMany({
        where: { kbId: id }
      }),
      prisma.knowledgeBase.delete({
        where: { id }
      })
    ])

    res.json({
      code: 200,
      data: null,
      message: '知识库删除成功'
    })
  } catch (error) {
    console.error('删除知识库失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '删除知识库失败'
    })
  }
})

// ==================== 文件夹管理接口 ====================

// 获取文件夹树
router.get('/:kbId/folders', async (req, res) => {
  try {
    const { kbId } = req.params

    // 递归获取完整的文件夹树
    const buildFolderTree = async (parentId = null) => {
      const folders = await prisma.folder.findMany({
        where: {
          kbId,
          parentId
        },
        include: {
          files: true
        },
        orderBy: { createdAt: 'asc' }
      })

      return Promise.all(
        folders.map(async folder => ({
          ...folder,
          children: await buildFolderTree(folder.id)
        }))
      )
    }

    const folderTree = await buildFolderTree()

    res.json({
      code: 200,
      data: folderTree,
      message: '获取文件夹树成功'
    })
  } catch (error) {
    console.error('获取文件夹树失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取文件夹树失败'
    })
  }
})

// 创建文件夹
router.post('/:kbId/folders', async (req, res) => {
  try {
    const { kbId } = req.params
    const { name, parentId } = req.body

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '文件夹名称不能为空',
        data: null
      })
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        kbId,
        parentId: parentId || null
      }
    })

    res.status(201).json({
      code: 201,
      data: folder,
      message: '文件夹创建成功'
    })
  } catch (error) {
    console.error('创建文件夹失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '创建文件夹失败'
    })
  }
})

// 更新文件夹
router.put('/:kbId/folders/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params
    const { name, parentId } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (parentId !== undefined) updateData.parentId = parentId

    const folder = await prisma.folder.update({
      where: { id: folderId },
      data: updateData
    })

    res.json({
      code: 200,
      data: folder,
      message: '文件夹更新成功'
    })
  } catch (error) {
    console.error('更新文件夹失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '更新文件夹失败'
    })
  }
})

// 删除文件夹
router.delete('/:kbId/folders/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params

    // 递归删除文件夹及其子文件夹和文件
    const deleteFolderRecursive = async (id) => {
      const subFolders = await prisma.folder.findMany({
        where: { parentId: id }
      })

      for (const subFolder of subFolders) {
        await deleteFolderRecursive(subFolder.id)
      }

      await prisma.file.deleteMany({
        where: { folderId: id }
      })

      await prisma.folder.delete({
        where: { id }
      })
    }

    await deleteFolderRecursive(folderId)

    res.json({
      code: 200,
      data: null,
      message: '文件夹删除成功'
    })
  } catch (error) {
    console.error('删除文件夹失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '删除文件夹失败'
    })
  }
})

// ==================== 文档管理接口 ====================

// 获取文档列表
router.get('/:kbId/files', async (req, res) => {
  try {
    const { kbId } = req.params
    const { folderId } = req.query

    const files = await prisma.file.findMany({
      where: {
        kbId,
        ...(folderId ? { folderId } : { folderId: null })
      },
      orderBy: { updatedAt: 'desc' }
    })

    res.json({
      code: 200,
      data: files,
      message: '获取文档列表成功'
    })
  } catch (error) {
    console.error('获取文档列表失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取文档列表失败'
    })
  }
})

// 创建文档
router.post('/:kbId/files', async (req, res) => {
  try {
    const { kbId } = req.params
    const { name, folderId, editorType = 'markdown', content = '' } = req.body

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '文档名称不能为空',
        data: null
      })
    }

    const file = await prisma.file.create({
      data: {
        name,
        kbId,
        folderId: folderId || null,
        editorType,
        content,
        mimeType: editorType === 'markdown' ? 'text/markdown' : 'text/html',
        size: content.length,
        storageUrl: '' // 暂时为空，后续可以存储到OSS
      }
    })

    // 更新知识库的文档计数
    await prisma.knowledgeBase.update({
      where: { id: kbId },
      data: {
        fileCount: {
          increment: 1
        }
      }
    })

    res.status(201).json({
      code: 201,
      data: file,
      message: '文档创建成功'
    })
  } catch (error) {
    console.error('创建文档失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '创建文档失败'
    })
  }
})

// 获取文档详情
router.get('/:kbId/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        kb: {
          select: { id: true, name: true }
        },
        folder: {
          select: { id: true, name: true }
        }
      }
    })

    if (!file) {
      return res.status(404).json({
        code: 404,
        message: '文档不存在',
        data: null
      })
    }

    res.json({
      code: 200,
      data: file,
      message: '获取文档详情成功'
    })
  } catch (error) {
    console.error('获取文档详情失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取文档详情失败'
    })
  }
})

// 更新文档内容
router.put('/:kbId/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params
    const { name, content, editorType } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (content !== undefined) {
      updateData.content = content
      updateData.size = content.length
    }
    if (editorType !== undefined) {
      updateData.editorType = editorType
      updateData.mimeType = editorType === 'markdown' ? 'text/markdown' : 'text/html'
    }

    const file = await prisma.file.update({
      where: { id: fileId },
      data: updateData
    })

    res.json({
      code: 200,
      data: file,
      message: '文档更新成功'
    })
  } catch (error) {
    console.error('更新文档失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '更新文档失败'
    })
  }
})

// 移动文档到文件夹
router.post('/:kbId/files/:fileId/move', async (req, res) => {
  try {
    const { fileId } = req.params
    const { folderId } = req.body

    const file = await prisma.file.update({
      where: { id: fileId },
      data: {
        folderId: folderId || null
      }
    })

    res.json({
      code: 200,
      data: file,
      message: '文档移动成功'
    })
  } catch (error) {
    console.error('移动文档失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '移动文档失败'
    })
  }
})

// 删除文档
router.delete('/:kbId/files/:fileId', async (req, res) => {
  try {
    const { kbId, fileId } = req.params

    await prisma.$transaction([
      prisma.docChunk.deleteMany({
        where: { fileId }
      }),
      prisma.file.delete({
        where: { id: fileId }
      })
    ])

    // 更新知识库的文档计数
    await prisma.knowledgeBase.update({
      where: { id: kbId },
      data: {
        fileCount: {
          decrement: 1
        }
      }
    })

    res.json({
      code: 200,
      data: null,
      message: '文档删除成功'
    })
  } catch (error) {
    console.error('删除文档失败:', error)
    res.status(500).json({
      code: 500,
      data: null,
      message: '删除文档失败'
    })
  }
})

// ==================== 文件上传接口 ====================

// 上传文件（简单上传，支持单个/多个文件）
router.post('/:kbId/files/upload', upload.array('files', 10), async (req, res) => {
  const { kbId } = req.params
  const { folderId } = req.body
  
  try {
    // 验证知识库是否存在
    const kb = await prisma.knowledgeBase.findUnique({
      where: { id: kbId }
    })
    
    if (!kb) {
      return res.status(404).json({
        code: 404,
        message: '知识库不存在',
        data: null
      })
    }

    const cloudStorage = getCloudStorageService()
    const parser = getMultimodalParser()
    const uploadResults = []

    // 处理每个上传的文件
    for (const file of req.files) {
      try {
        // 读取文件数据
        const fileBuffer = await fs.readFile(file.path)
        
        // 上传到云存储
        const uploadResult = await cloudStorage.upload(fileBuffer, {
          fileName: file.originalname,
          mimeType: file.mimetype,
          folder: `kb/${kbId}`
        })

        // 解析文件内容
        const parseResult = await parser.parseFile(file.path, file.mimetype)

        // 创建文件记录
        const fileRecord = await prisma.file.create({
          data: {
            kbId,
            folderId: folderId || null,
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            storageUrl: uploadResult.url,
            fileType: 'uploaded',
            originalName: file.originalname,
            fileFormat: path.extname(file.originalname).substring(1),
            uploadUrl: uploadResult.url,
            localPath: uploadResult.provider === 'local' ? uploadResult.key : null,
            fileSize: file.size,
            extractedText: parseResult.extractedText || '',
            thumbnail: parseResult.thumbnail || null,
            metadata: JSON.stringify(parseResult.metadata || {}),
            processingStatus: parseResult.success ? 'completed' : 'failed'
          }
        })

        // 如果解析成功，创建知识块
        if (parseResult.success && parseResult.chunks && parseResult.chunks.length > 0) {
          await prisma.knowledgeChunk.createMany({
            data: parseResult.chunks.map(chunk => ({
              fileId: fileRecord.id,
              type: chunk.type,
              content: chunk.content,
              metadata: JSON.stringify(chunk.metadata || {})
            }))
          })
        }

        uploadResults.push({
          success: true,
          file: fileRecord,
          extractedText: parseResult.extractedText?.substring(0, 200) + '...'
        })

        // 删除临时文件
        await fs.unlink(file.path).catch(() => {})
        
      } catch (error) {
        console.error(`文件上传失败: ${file.originalname}`, error)
        uploadResults.push({
          success: false,
          fileName: file.originalname,
          error: error.message
        })
        
        // 删除临时文件
        await fs.unlink(file.path).catch(() => {})
      }
    }

    // 更新知识库文档计数
    const successCount = uploadResults.filter(r => r.success).length
    if (successCount > 0) {
      await prisma.knowledgeBase.update({
        where: { id: kbId },
        data: {
          fileCount: {
            increment: successCount
          }
        }
      })
    }

    res.status(201).json({
      code: 201,
      message: `成功上传 ${successCount}/${req.files.length} 个文件`,
      data: {
        results: uploadResults,
        successCount,
        totalCount: req.files.length
      }
    })
  } catch (error) {
    console.error('文件上传失败:', error)
    res.status(500).json({
      code: 500,
      message: '文件上传失败',
      data: null
    })
  }
})

// 上传知识库封面
router.post('/:kbId/cover', upload.single('cover'), async (req, res) => {
  const { kbId } = req.params
  
  try {
    // 验证知识库是否存在
    const kb = await prisma.knowledgeBase.findUnique({
      where: { id: kbId }
    })
    
    if (!kb) {
      return res.status(404).json({
        code: 404,
        message: '知识库不存在',
        data: null
      })
    }

    // 读取文件数据
    const fileBuffer = await fs.readFile(req.file.path)
    
    // 上传到云存储
    const cloudStorage = getCloudStorageService()
    const uploadResult = await cloudStorage.upload(fileBuffer, {
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder: `covers`
    })

    // 更新知识库封面
    const updatedKb = await prisma.knowledgeBase.update({
      where: { id: kbId },
      data: {
        coverImage: uploadResult.url
      }
    })

    // 删除临时文件
    await fs.unlink(req.file.path).catch(() => {})

    res.json({
      code: 200,
      message: '封面上传成功',
      data: {
        coverImage: uploadResult.url,
        knowledgeBase: updatedKb
      }
    })
  } catch (error) {
    console.error('封面上传失败:', error)
    
    // 删除临时文件
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {})
    }
    
    res.status(500).json({
      code: 500,
      message: '封面上传失败',
      data: null
    })
  }
})

// 获取文件详情（包含解析结果和知识块）
router.get('/:kbId/files/:fileId/detail', async (req, res) => {
  const { kbId, fileId } = req.params
  
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        kbId
      },
      include: {
        knowledgeChunks: {
          orderBy: { createdAt: 'asc' }
        },
        folder: {
          select: { id: true, name: true }
        }
      }
    })

    if (!file) {
      return res.status(404).json({
        code: 404,
        message: '文件不存在',
        data: null
      })
    }

    res.json({
      code: 200,
      message: '获取文件详情成功',
      data: {
        ...file,
        metadata: file.metadata ? JSON.parse(file.metadata) : {},
        knowledgeChunks: file.knowledgeChunks.map(chunk => ({
          ...chunk,
          metadata: chunk.metadata ? JSON.parse(chunk.metadata) : {}
        }))
      }
    })
  } catch (error) {
    console.error('获取文件详情失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取文件详情失败',
      data: null
    })
  }
})

// 重新解析文件
router.post('/:kbId/files/:fileId/reparse', async (req, res) => {
  const { kbId, fileId } = req.params
  
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        kbId
      }
    })

    if (!file) {
      return res.status(404).json({
        code: 404,
        message: '文件不存在',
        data: null
      })
    }

    // 下载文件
    const cloudStorage = getCloudStorageService()
    let filePath
    
    if (file.localPath) {
      filePath = path.join(process.cwd(), 'uploads', file.localPath)
    } else {
      // 从云存储下载
      const fileBuffer = await cloudStorage.download(file.storageUrl)
      const tempPath = path.join(process.cwd(), 'uploads/temp', `${Date.now()}-${file.name}`)
      await fs.writeFile(tempPath, fileBuffer)
      filePath = tempPath
    }

    // 重新解析
    const parser = getMultimodalParser()
    const parseResult = await parser.parseFile(filePath, file.mimeType)

    // 删除旧的知识块
    await prisma.knowledgeChunk.deleteMany({
      where: { fileId }
    })

    // 创建新的知识块
    if (parseResult.success && parseResult.chunks && parseResult.chunks.length > 0) {
      await prisma.knowledgeChunk.createMany({
        data: parseResult.chunks.map(chunk => ({
          fileId: file.id,
          type: chunk.type,
          content: chunk.content,
          metadata: JSON.stringify(chunk.metadata || {})
        }))
      })
    }

    // 更新文件记录
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        extractedText: parseResult.extractedText || '',
        metadata: JSON.stringify(parseResult.metadata || {}),
        processingStatus: parseResult.success ? 'completed' : 'failed'
      },
      include: {
        knowledgeChunks: true
      }
    })

    // 清理临时文件
    if (!file.localPath) {
      await fs.unlink(filePath).catch(() => {})
    }

    res.json({
      code: 200,
      message: '文件重新解析成功',
      data: {
        file: updatedFile,
        extractedText: parseResult.extractedText?.substring(0, 200) + '...'
      }
    })
  } catch (error) {
    console.error('重新解析文件失败:', error)
    res.status(500).json({
      code: 500,
      message: '重新解析文件失败',
      data: null
    })
  }
})

export default router
