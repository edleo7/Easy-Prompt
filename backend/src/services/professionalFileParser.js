/**
 * 专业文件解析服务
 * 集成专业PDF和Word解析库
 */

import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import imageOCRService from './imageOCRService.js'

const prisma = new PrismaClient()

/**
 * 专业文件解析器配置
 */
const PARSER_CONFIG = {
  pdf: {
    enabled: process.env.PDF_PARSER_ENABLED === 'true',
    library: process.env.PDF_PARSER_LIBRARY || 'pdf-parse', // pdf-parse, pdf2pic, pdfjs-dist
    options: {
      max: 0, // 解析所有页面
      version: 'v1.10.100'
    }
  },
  word: {
    enabled: process.env.WORD_PARSER_ENABLED === 'true',
    library: process.env.WORD_PARSER_LIBRARY || 'mammoth', // mammoth, docx-parser
    options: {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh"
      ]
    }
  },
  excel: {
    enabled: process.env.EXCEL_PARSER_ENABLED === 'true',
    library: process.env.EXCEL_PARSER_LIBRARY || 'xlsx',
    options: {
      cellDates: true,
      cellNF: false,
      cellText: false
    }
  },
  powerpoint: {
    enabled: process.env.PPT_PARSER_ENABLED === 'true',
    library: process.env.PPT_PARSER_LIBRARY || 'pptx2json',
    options: {}
  }
}

class ProfessionalFileParser {
  constructor() {
    this.parsers = {}
    this.initializeParsers()
  }

  async initializeParsers() {
    try {
      // 初始化PDF解析器
      if (PARSER_CONFIG.pdf.enabled) {
        await this.initializePdfParser()
      }

      // 初始化Word解析器
      if (PARSER_CONFIG.word.enabled) {
        await this.initializeWordParser()
      }

      // 初始化Excel解析器
      if (PARSER_CONFIG.excel.enabled) {
        await this.initializeExcelParser()
      }

      // 初始化PowerPoint解析器
      if (PARSER_CONFIG.powerpoint.enabled) {
        await this.initializePowerPointParser()
      }

      console.log('✅ 专业文件解析器初始化完成')
    } catch (error) {
      console.error('专业文件解析器初始化失败:', error)
    }
  }

  async initializePdfParser() {
    try {
      if (PARSER_CONFIG.pdf.library === 'pdf-parse') {
        const pdfParse = await import('pdf-parse')
        this.parsers.pdf = pdfParse.default
      } else if (PARSER_CONFIG.pdf.library === 'pdfjs-dist') {
        const pdfjsLib = await import('pdfjs-dist')
        this.parsers.pdf = pdfjsLib
      }
      console.log('✅ PDF解析器初始化成功')
    } catch (error) {
      console.warn('PDF解析器初始化失败，将使用基础解析:', error.message)
    }
  }

  async initializeWordParser() {
    try {
      if (PARSER_CONFIG.word.library === 'mammoth') {
        const mammoth = await import('mammoth')
        this.parsers.word = mammoth
      } else if (PARSER_CONFIG.word.library === 'docx-parser') {
        const docxParser = await import('docx-parser')
        this.parsers.word = docxParser
      }
      console.log('✅ Word解析器初始化成功')
    } catch (error) {
      console.warn('Word解析器初始化失败，将使用基础解析:', error.message)
    }
  }

  async initializeExcelParser() {
    try {
      if (PARSER_CONFIG.excel.library === 'xlsx') {
        const XLSX = await import('xlsx')
        this.parsers.excel = XLSX
      }
      console.log('✅ Excel解析器初始化成功')
    } catch (error) {
      console.warn('Excel解析器初始化失败，将使用基础解析:', error.message)
    }
  }

  async initializePowerPointParser() {
    try {
      if (PARSER_CONFIG.powerpoint.library === 'pptx2json') {
        const pptx2json = await import('pptx2json')
        this.parsers.pptx = pptx2json
      }
      console.log('✅ PowerPoint解析器初始化成功')
    } catch (error) {
      console.warn('PowerPoint解析器初始化失败，将使用基础解析:', error.message)
    }
  }

  /**
   * 解析文件内容
   * @param {string} filePath - 文件路径
   * @param {string} mimeType - MIME类型
   * @returns {Promise<Object>} 解析结果
   */
  async parseFile(filePath, mimeType) {
    try {
      // 检查是否为图片文件
      if (imageOCRService.isSupportedImageType(mimeType)) {
        return await this.parseImageFile(filePath, mimeType)
      }

      const fileExtension = this.getFileExtension(mimeType)
      
      switch (fileExtension) {
        case 'pdf':
          return await this.parsePdfFile(filePath)
        
        case 'docx':
        case 'doc':
          return await this.parseWordFile(filePath)
        
        case 'xlsx':
        case 'xls':
          return await this.parseExcelFile(filePath)
        
        case 'pptx':
        case 'ppt':
          return await this.parsePowerPointFile(filePath)
        
        default:
          return await this.parseTextFile(filePath)
      }
    } catch (error) {
      console.error('文件解析错误:', error)
      throw error
    }
  }

  /**
   * 解析PDF文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 解析结果
   */
  async parsePdfFile(filePath) {
    try {
      if (this.parsers.pdf && PARSER_CONFIG.pdf.library === 'pdf-parse') {
        const dataBuffer = await fs.readFile(filePath)
        const data = await this.parsers.pdf(dataBuffer, PARSER_CONFIG.pdf.options)
        
        return {
          content: data.text,
          pages: data.numpages,
          info: data.info,
          metadata: {
            title: data.info?.Title,
            author: data.info?.Author,
            subject: data.info?.Subject,
            creator: data.info?.Creator,
            producer: data.info?.Producer,
            creationDate: data.info?.CreationDate,
            modificationDate: data.info?.ModDate
          },
          type: 'pdf'
        }
      } else if (this.parsers.pdf && PARSER_CONFIG.pdf.library === 'pdfjs-dist') {
        return await this.parsePdfWithPdfjs(filePath)
      } else {
        // 降级到基础解析
        return await this.parseTextFile(filePath)
      }
    } catch (error) {
      console.error('PDF解析错误:', error)
      throw error
    }
  }

  /**
   * 使用PDF.js解析PDF
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 解析结果
   */
  async parsePdfWithPdfjs(filePath) {
    const dataBuffer = await fs.readFile(filePath)
    const pdf = await this.parsers.pdf.getDocument(dataBuffer).promise
    const numPages = pdf.numPages
    let fullText = ''

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += pageText + '\n'
    }

    return {
      content: fullText,
      pages: numPages,
      type: 'pdf'
    }
  }

  /**
   * 解析Word文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 解析结果
   */
  async parseWordFile(filePath) {
    try {
      if (this.parsers.word && PARSER_CONFIG.word.library === 'mammoth') {
        const dataBuffer = await fs.readFile(filePath)
        const result = await this.parsers.word.convertToHtml({ buffer: dataBuffer }, PARSER_CONFIG.word.options)
        
        return {
          content: result.value,
          messages: result.messages,
          type: 'word'
        }
      } else {
        // 降级到基础解析
        return await this.parseTextFile(filePath)
      }
    } catch (error) {
      console.error('Word解析错误:', error)
      throw error
    }
  }

  /**
   * 解析Excel文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 解析结果
   */
  async parseExcelFile(filePath) {
    try {
      if (this.parsers.excel) {
        const workbook = this.parsers.excel.readFile(filePath, PARSER_CONFIG.excel.options)
        const sheetNames = workbook.SheetNames
        const sheets = {}

        sheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = this.parsers.excel.utils.sheet_to_json(worksheet, { header: 1 })
          sheets[sheetName] = jsonData
        })

        return {
          content: JSON.stringify(sheets, null, 2),
          sheets: sheets,
          sheetNames: sheetNames,
          type: 'excel'
        }
      } else {
        return await this.parseTextFile(filePath)
      }
    } catch (error) {
      console.error('Excel解析错误:', error)
      throw error
    }
  }

  /**
   * 解析PowerPoint文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 解析结果
   */
  async parsePowerPointFile(filePath) {
    try {
      if (this.parsers.pptx) {
        const dataBuffer = await fs.readFile(filePath)
        const result = await this.parsers.pptx(dataBuffer)
        
        return {
          content: JSON.stringify(result, null, 2),
          slides: result.slides || [],
          type: 'powerpoint'
        }
      } else {
        return await this.parseTextFile(filePath)
      }
    } catch (error) {
      console.error('PowerPoint解析错误:', error)
      throw error
    }
  }

  /**
   * 解析图片文件（OCR识别）
   * @param {string} filePath - 文件路径
   * @param {string} mimeType - MIME类型
   * @returns {Promise<Object>} 解析结果
   */
  async parseImageFile(filePath, mimeType) {
    try {
      console.log(`开始OCR识别图片: ${filePath}`)
      
      // 使用OCR服务识别图片中的文字
      const ocrResult = await imageOCRService.processImage(filePath, mimeType, {
        includeLayout: true,
        includeTables: true,
        includeCode: true
      })

      if (!ocrResult.success) {
        throw new Error(`OCR识别失败: ${ocrResult.error}`)
      }

      return {
        content: ocrResult.content,
        metadata: {
          ...ocrResult.metadata,
          originalType: mimeType,
          ocrModel: ocrResult.metadata.model
        },
        type: 'image_ocr'
      }
    } catch (error) {
      console.error('图片OCR解析错误:', error)
      throw error
    }
  }

  /**
   * 解析文本文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 解析结果
   */
  async parseTextFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return {
        content: content,
        type: 'text'
      }
    } catch (error) {
      console.error('文本文件解析错误:', error)
      throw error
    }
  }

  /**
   * 获取文件扩展名
   * @param {string} mimeType - MIME类型
   * @returns {string} 文件扩展名
   */
  getFileExtension(mimeType) {
    const mimeToExt = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/vnd.ms-powerpoint': 'ppt',
      'text/plain': 'txt',
      'text/markdown': 'md',
      'text/csv': 'csv',
      'application/json': 'json',
      'text/html': 'html',
      // 图片格式
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/bmp': 'bmp',
      'image/gif': 'gif',
      'image/tiff': 'tiff',
      'image/tif': 'tif',
      'image/webp': 'webp',
      'image/heif': 'heif',
      'image/heic': 'heic'
    }
    
    return mimeToExt[mimeType] || 'txt'
  }

  /**
   * 获取解析器状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      pdf: {
        enabled: PARSER_CONFIG.pdf.enabled,
        library: PARSER_CONFIG.pdf.library,
        initialized: !!this.parsers.pdf
      },
      word: {
        enabled: PARSER_CONFIG.word.enabled,
        library: PARSER_CONFIG.word.library,
        initialized: !!this.parsers.word
      },
      excel: {
        enabled: PARSER_CONFIG.excel.enabled,
        library: PARSER_CONFIG.excel.library,
        initialized: !!this.parsers.excel
      },
      powerpoint: {
        enabled: PARSER_CONFIG.powerpoint.enabled,
        library: PARSER_CONFIG.powerpoint.library,
        initialized: !!this.parsers.pptx
      },
      image: {
        enabled: true,
        library: 'deepseek-vl-7b-chat',
        initialized: imageOCRService.isInitialized,
        supportedTypes: Object.keys(imageOCRService.getStatus().supportedTypes)
      }
    }
  }
}

// 创建单例实例
const professionalParser = new ProfessionalFileParser()

export default professionalParser
