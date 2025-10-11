/**
 * OCR识别API
 * 提供图片文字识别功能
 */

import express from 'express'
import multer from 'multer'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import imageOCRService from '../services/imageOCRService.js'

const router = express.Router()
const prisma = new PrismaClient()

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `ocr-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (imageOCRService.isSupportedImageType(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的图片格式'), false)
    }
  }
})

/**
 * 单张图片OCR识别
 * POST /api/v1/ocr/recognize
 */
router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请上传图片文件',
        data: null
      })
    }

    const { prompt, options } = req.body
    const imagePath = req.file.path
    const mimeType = req.file.mimetype

    // 解析选项
    const ocrOptions = {
      includeLayout: options?.includeLayout !== false,
      includeTables: options?.includeTables !== false,
      includeCode: options?.includeCode !== false,
      language: options?.language,
      prompt: prompt
    }

    // 执行OCR识别
    const result = await imageOCRService.processImage(imagePath, mimeType, ocrOptions)

    if (!result.success) {
      return res.status(500).json({
        code: 500,
        message: 'OCR识别失败',
        data: {
          error: result.error
        }
      })
    }

    res.json({
      code: 200,
      message: 'OCR识别成功',
      data: {
        text: result.content,
        metadata: result.metadata,
        originalFile: {
          name: req.file.originalname,
          size: req.file.size,
          mimeType: mimeType
        }
      }
    })
  } catch (error) {
    console.error('OCR识别错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: {
        error: error.message
      }
    })
  }
})

/**
 * 批量图片OCR识别
 * POST /api/v1/ocr/batch
 */
router.post('/batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请上传图片文件',
        data: null
      })
    }

    const { options } = req.body
    const ocrOptions = {
      includeLayout: options?.includeLayout !== false,
      includeTables: options?.includeTables !== false,
      includeCode: options?.includeCode !== false,
      language: options?.language
    }

    // 准备文件列表
    const imageFiles = req.files.map(file => ({
      id: file.filename,
      name: file.originalname,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size
    }))

    // 批量处理
    const results = await imageOCRService.batchProcessImages(imageFiles, ocrOptions)

    res.json({
      code: 200,
      message: '批量OCR识别完成',
      data: {
        results: results,
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })
  } catch (error) {
    console.error('批量OCR识别错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: {
        error: error.message
      }
    })
  }
})

/**
 * 获取OCR服务状态
 * GET /api/v1/ocr/status
 */
router.get('/status', (req, res) => {
  try {
    const status = imageOCRService.getStatus()
    
    res.json({
      code: 200,
      message: '获取OCR服务状态成功',
      data: status
    })
  } catch (error) {
    console.error('获取OCR状态错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: {
        error: error.message
      }
    })
  }
})

/**
 * 获取支持的图片格式
 * GET /api/v1/ocr/formats
 */
router.get('/formats', (req, res) => {
  try {
    const formats = Object.keys(imageOCRService.getStatus().supportedTypes).map(mimeType => ({
      mimeType,
      extension: imageOCRService.getStatus().supportedTypes[mimeType],
      description: getFormatDescription(mimeType)
    }))
    
    res.json({
      code: 200,
      message: '获取支持的图片格式成功',
      data: {
        formats,
        total: formats.length
      }
    })
  } catch (error) {
    console.error('获取图片格式错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: {
        error: error.message
      }
    })
  }
})

/**
 * 获取格式描述
 * @param {string} mimeType - MIME类型
 * @returns {string} 格式描述
 */
function getFormatDescription(mimeType) {
  const descriptions = {
    'image/png': 'PNG图片格式，支持透明背景',
    'image/jpeg': 'JPEG图片格式，适合照片',
    'image/jpg': 'JPG图片格式，适合照片',
    'image/bmp': 'BMP位图格式，无损压缩',
    'image/gif': 'GIF动图格式，支持动画',
    'image/tiff': 'TIFF图片格式，高质量',
    'image/tif': 'TIF图片格式，高质量',
    'image/webp': 'WebP图片格式，现代格式',
    'image/heif': 'HEIF图片格式，高效压缩',
    'image/heic': 'HEIC图片格式，苹果格式'
  }
  return descriptions[mimeType] || '未知图片格式'
}

export default router
