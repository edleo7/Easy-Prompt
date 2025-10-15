/**
 * 多模态文件解析服务
 * 支持：PDF、DOCX、XLSX、图片OCR、音视频处理
 */

import fs from 'fs/promises'
import path from 'path'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import pptx2json from 'pptx2json'
import imageOCRService from './imageOCRService.js'

// 设置FFmpeg路径
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

class MultimodalParser {
  constructor() {
    this.supportedFormats = {
      document: ['pdf', 'docx', 'doc', 'txt', 'md'],
      presentation: ['pptx', 'ppt'],
      spreadsheet: ['xlsx', 'xls', 'csv'],
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
      audio: ['mp3', 'wav', 'm4a', 'aac'],
      video: ['mp4', 'mov', 'avi', 'mkv']
    }
  }

  /**
   * 解析文件（统一入口）
   * @param {String} filePath - 文件路径
   * @param {String} mimeType - MIME类型
   * @returns {Promise<Object>} 解析结果
   */
  async parseFile(filePath, mimeType) {
    const ext = path.extname(filePath).toLowerCase().substring(1)
    
    try {
      // 根据文件类型分发到对应的解析器
      if (this.supportedFormats.document.includes(ext)) {
        return await this.parseDocument(filePath, ext)
      } else if (this.supportedFormats.presentation.includes(ext)) {
        return await this.parsePresentation(filePath, ext)
      } else if (this.supportedFormats.spreadsheet.includes(ext)) {
        return await this.parseSpreadsheet(filePath, ext)
      } else if (this.supportedFormats.image.includes(ext)) {
        return await this.parseImage(filePath)
      } else if (this.supportedFormats.audio.includes(ext)) {
        return await this.parseAudio(filePath)
      } else if (this.supportedFormats.video.includes(ext)) {
        return await this.parseVideo(filePath)
      } else {
        return {
          success: false,
          error: `不支持的文件格式: ${ext}`,
          extractedText: '',
          metadata: {}
        }
      }
    } catch (error) {
      console.error(`文件解析失败: ${filePath}`, error)
      return {
        success: false,
        error: error.message,
        extractedText: '',
        metadata: {}
      }
    }
  }

  /**
   * 解析文档（PDF、DOCX、TXT、MD）
   */
  async parseDocument(filePath, format) {
    let extractedText = ''
    let metadata = {}

    switch (format) {
      case 'pdf':
        const pdfBuffer = await fs.readFile(filePath)
        const pdfData = await pdfParse(pdfBuffer)
        extractedText = pdfData.text
        metadata = {
          pages: pdfData.numpages,
          info: pdfData.info,
          version: pdfData.version
        }
        break

      case 'docx':
      case 'doc':
        const docxResult = await mammoth.extractRawText({ path: filePath })
        extractedText = docxResult.value
        metadata = {
          messages: docxResult.messages
        }
        break

      case 'txt':
      case 'md':
        extractedText = await fs.readFile(filePath, 'utf-8')
        metadata = {
          encoding: 'utf-8',
          lines: extractedText.split('\n').length
        }
        break

      default:
        throw new Error(`不支持的文档格式: ${format}`)
    }

    return {
      success: true,
      extractedText: extractedText.trim(),
      metadata,
      chunks: this.splitTextIntoChunks(extractedText)
    }
  }

  /**
   * 解析表格（XLSX、XLS、CSV）
   */
  async parseSpreadsheet(filePath, format) {
    const workbook = XLSX.readFile(filePath)
    const allSheets = []
    let extractedText = ''

    // 遍历所有工作表
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      const csvText = XLSX.utils.sheet_to_csv(worksheet)
      
      allSheets.push({
        name: sheetName,
        rows: jsonData.length,
        cols: jsonData[0]?.length || 0,
        data: jsonData.slice(0, 10) // 只保留前10行作为预览
      })
      
      extractedText += `\n=== ${sheetName} ===\n${csvText}\n`
    })

    return {
      success: true,
      extractedText: extractedText.trim(),
      metadata: {
        sheets: allSheets,
        totalSheets: workbook.SheetNames.length
      },
      chunks: this.splitTextIntoChunks(extractedText)
    }
  }

  /**
   * 解析演示文稿（PPTX、PPT）
   */
  async parsePresentation(filePath, format) {
    try {
      if (format === 'pptx') {
        // 使用pptx2json解析PPTX文件
        const presentation = await pptx2json(filePath)
        
        let extractedText = ''
        const slides = []
        
        // 提取每页幻灯片的内容
        presentation.slides.forEach((slide, index) => {
          const slideText = []
          
          // 提取文本内容
          if (slide.texts && slide.texts.length > 0) {
            slide.texts.forEach(textObj => {
              if (textObj.text && textObj.text.trim()) {
                slideText.push(textObj.text.trim())
              }
            })
          }
          
          // 提取表格内容
          if (slide.tables && slide.tables.length > 0) {
            slide.tables.forEach(table => {
              if (table.rows && table.rows.length > 0) {
                const tableText = table.rows.map(row => 
                  row.cells ? row.cells.map(cell => cell.text || '').join('\t') : ''
                ).join('\n')
                slideText.push(`表格内容:\n${tableText}`)
              }
            })
          }
          
          const slideContent = slideText.join('\n')
          if (slideContent.trim()) {
            slides.push({
              slideNumber: index + 1,
              content: slideContent,
              textCount: slideText.length
            })
            extractedText += `\n=== 幻灯片 ${index + 1} ===\n${slideContent}\n`
          }
        })
        
        return {
          success: true,
          extractedText: extractedText.trim(),
          metadata: {
            totalSlides: presentation.slides.length,
            slidesWithContent: slides.length,
            format: format,
            slides: slides
          },
          chunks: this.splitTextIntoChunks(extractedText, 800)
        }
      } else {
        // PPT格式暂不支持
        return {
          success: false,
          error: 'PPT格式暂不支持，请使用PPTX格式',
          extractedText: '[PPT格式暂不支持]',
          metadata: { format: format },
          chunks: []
        }
      }
    } catch (error) {
      console.error('演示文稿解析失败:', error)
      return {
        success: false,
        error: error.message,
        extractedText: '[演示文稿解析失败]',
        metadata: { format: format, error: error.message },
        chunks: []
      }
    }
  }

  /**
   * 解析图片（OCR文字识别）
   */
  async parseImage(filePath) {
    try {
      // 使用sharp获取图片元数据
      const imageMetadata = await sharp(filePath).metadata()
      
      // 生成缩略图
      const thumbnailBuffer = await sharp(filePath)
        .resize(300, 300, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer()
      
      // 保存缩略图
      const thumbnailPath = filePath.replace(/\.\w+$/, '_thumb.jpg')
      await fs.writeFile(thumbnailPath, thumbnailBuffer)

      // OCR文字识别
      let extractedText = ''
      try {
        extractedText = await imageOCRService.recognizeText(filePath)
      } catch (ocrError) {
        console.warn('OCR识别失败:', ocrError.message)
        extractedText = '[图片无法识别文字]'
      }

      return {
        success: true,
        extractedText,
        thumbnail: thumbnailPath,
        metadata: {
          width: imageMetadata.width,
          height: imageMetadata.height,
          format: imageMetadata.format,
          space: imageMetadata.space,
          channels: imageMetadata.channels,
          hasAlpha: imageMetadata.hasAlpha
        },
        chunks: extractedText ? this.splitTextIntoChunks(extractedText) : []
      }
    } catch (error) {
      console.error('图片解析失败:', error)
      return {
        success: false,
        error: error.message,
        extractedText: '',
        metadata: {}
      }
    }
  }

  /**
   * 解析音频（语音转文字）
   * 使用FFmpeg提取音频并转换为文本
   */
  async parseAudio(filePath) {
    try {
      const stats = await fs.stat(filePath)
      const tempDir = path.join(process.cwd(), 'uploads', 'temp')
      await fs.mkdir(tempDir, { recursive: true })
      
      // 获取音频信息
      const audioInfo = await this.getAudioInfo(filePath)
      
      // 使用FFmpeg将音频转换为WAV格式（用于语音识别）
      const wavPath = path.join(tempDir, `audio_${Date.now()}.wav`)
      
      await new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .audioChannels(1) // 单声道
          .audioFrequency(16000) // 16kHz采样率
          .format('wav')
          .on('end', resolve)
          .on('error', reject)
          .save(wavPath)
      })
      
      // 使用AI服务进行语音转文字
      const transcription = await this.transcribeAudio(wavPath)
      
      // 清理临时文件
      await fs.unlink(wavPath).catch(() => {})
      
      const chunks = this.splitTextIntoChunks(transcription, 500)
      
      return {
        success: true,
        extractedText: transcription,
        metadata: {
          ...audioInfo,
          size: stats.size,
          type: 'audio',
          duration: audioInfo.duration,
          format: audioInfo.format
        },
        chunks: chunks.map(chunk => ({
          ...chunk,
          type: 'audio_transcription'
        }))
      }
    } catch (error) {
      console.error('音频解析失败:', error)
      return {
        success: false,
        error: error.message,
        extractedText: '[音频文件解析失败]',
        metadata: { type: 'audio', error: error.message },
        chunks: []
      }
    }
  }

  /**
   * 解析视频（关键帧提取+字幕）
   * 使用FFmpeg提取关键帧、音频和字幕信息
   */
  async parseVideo(filePath) {
    try {
      const stats = await fs.stat(filePath)
      const tempDir = path.join(process.cwd(), 'uploads', 'temp')
      await fs.mkdir(tempDir, { recursive: true })
      
      // 获取视频信息
      const videoInfo = await this.getVideoInfo(filePath)
      
      // 提取关键帧
      const keyframes = await this.extractKeyframes(filePath, tempDir)
      
      // 提取音频并转文字
      let audioTranscription = ''
      try {
        const audioPath = path.join(tempDir, `audio_${Date.now()}.wav`)
        await this.extractAudioFromVideo(filePath, audioPath)
        audioTranscription = await this.transcribeAudio(audioPath)
        await fs.unlink(audioPath).catch(() => {})
      } catch (error) {
        console.warn('视频音频提取失败:', error.message)
      }
      
      // 提取字幕（如果有）
      const subtitles = await this.extractSubtitles(filePath, tempDir)
      
      // 组合所有文本内容
      const allText = [
        audioTranscription,
        ...subtitles.map(sub => sub.text)
      ].filter(text => text && text.trim()).join('\n\n')
      
      const chunks = this.splitTextIntoChunks(allText, 800)
      
      return {
        success: true,
        extractedText: allText || '[视频文件，已提取关键帧信息]',
        metadata: {
          ...videoInfo,
          size: stats.size,
          type: 'video',
          keyframes: keyframes.length,
          subtitles: subtitles.length,
          hasAudio: !!audioTranscription
        },
        chunks: [
          ...chunks.map(chunk => ({
            ...chunk,
            type: 'video_content'
          })),
          ...keyframes.map((frame, index) => ({
            index: chunks.length + index,
            type: 'video_frame',
            content: `关键帧 ${index + 1}`,
            metadata: {
              timestamp: frame.timestamp,
              description: frame.description || '视频关键帧'
            }
          }))
        ],
        thumbnail: keyframes[0]?.path || null
      }
    } catch (error) {
      console.error('视频解析失败:', error)
      return {
        success: false,
        error: error.message,
        extractedText: '[视频文件解析失败]',
        metadata: { type: 'video', error: error.message },
        chunks: []
      }
    }
  }

  /**
   * 将长文本分割成知识块
   * @param {String} text - 原始文本
   * @param {Number} chunkSize - 每块大小（字符数）
   * @returns {Array<Object>} 知识块数组
   */
  splitTextIntoChunks(text, chunkSize = 1000) {
    if (!text || text.length === 0) return []

    const chunks = []
    const paragraphs = text.split(/\n\n+/)
    let currentChunk = ''
    let chunkIndex = 0

    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length > chunkSize && currentChunk.length > 0) {
        // 当前块已满，保存并开始新块
        chunks.push({
          index: chunkIndex++,
          type: 'text',
          content: currentChunk.trim(),
          metadata: {
            charCount: currentChunk.length,
            wordCount: currentChunk.split(/\s+/).length
          }
        })
        currentChunk = paragraph
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph
      }
    }

    // 添加最后一块
    if (currentChunk.trim().length > 0) {
      chunks.push({
        index: chunkIndex,
        type: 'text',
        content: currentChunk.trim(),
        metadata: {
          charCount: currentChunk.length,
          wordCount: currentChunk.split(/\s+/).length
        }
      })
    }

    return chunks
  }

  /**
   * 生成文件摘要
   * @param {String} text - 文本内容
   * @param {Number} maxLength - 最大长度
   * @returns {String} 摘要
   */
  generateSummary(text, maxLength = 200) {
    if (!text || text.length === 0) return ''
    
    // 简单截取前N个字符
    let summary = text.substring(0, maxLength).trim()
    
    // 在句号、问号、感叹号处截断
    const lastPunctuation = Math.max(
      summary.lastIndexOf('。'),
      summary.lastIndexOf('？'),
      summary.lastIndexOf('！'),
      summary.lastIndexOf('.'),
      summary.lastIndexOf('?'),
      summary.lastIndexOf('!')
    )
    
    if (lastPunctuation > maxLength / 2) {
      summary = summary.substring(0, lastPunctuation + 1)
    } else if (text.length > maxLength) {
      summary += '...'
    }
    
    return summary
  }

  /**
   * 提取关键词（简单实现）
   * @param {String} text - 文本内容
   * @param {Number} count - 关键词数量
   * @returns {Array<String>} 关键词数组
   */
  extractKeywords(text, count = 10) {
    if (!text) return []

    // 分词（简单按空格和标点分割）
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)

    // 统计词频
    const wordCount = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    // 排序并取前N个
    const sortedWords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word]) => word)

    return sortedWords
  }

  /**
   * 获取音频文件信息
   * @param {String} filePath - 音频文件路径
   * @returns {Promise<Object>} 音频信息
   */
  async getAudioInfo(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err)
          return
        }
        
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio')
        resolve({
          duration: parseFloat(metadata.format.duration) || 0,
          format: metadata.format.format_name,
          bitrate: parseInt(metadata.format.bit_rate) || 0,
          sampleRate: audioStream?.sample_rate || 0,
          channels: audioStream?.channels || 0
        })
      })
    })
  }

  /**
   * 获取视频文件信息
   * @param {String} filePath - 视频文件路径
   * @returns {Promise<Object>} 视频信息
   */
  async getVideoInfo(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err)
          return
        }
        
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video')
        resolve({
          duration: parseFloat(metadata.format.duration) || 0,
          format: metadata.format.format_name,
          bitrate: parseInt(metadata.format.bit_rate) || 0,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          fps: eval(videoStream?.r_frame_rate) || 0
        })
      })
    })
  }

  /**
   * 语音转文字（使用AI服务）
   * @param {String} audioPath - 音频文件路径
   * @returns {Promise<String>} 转录文本
   */
  async transcribeAudio(audioPath) {
    try {
      // 这里可以集成各种语音识别服务
      // 目前使用模拟实现，实际项目中可以集成：
      // - OpenAI Whisper API
      // - 阿里云语音识别
      // - 腾讯云语音识别
      // - 百度语音识别
      
      const { getAIService } = await import('./aiService.js')
      const aiService = getAIService()
      
      // 模拟语音转文字（实际需要将音频文件发送到AI服务）
      const mockTranscription = `[语音转文字] 这是一个音频文件的转录内容。在实际应用中，这里会是通过AI服务识别出的真实文本内容。`
      
      return mockTranscription
    } catch (error) {
      console.error('语音转文字失败:', error)
      return '[语音转文字失败]'
    }
  }

  /**
   * 提取视频关键帧
   * @param {String} videoPath - 视频文件路径
   * @param {String} outputDir - 输出目录
   * @returns {Promise<Array>} 关键帧信息
   */
  async extractKeyframes(videoPath, outputDir) {
    return new Promise((resolve, reject) => {
      const keyframes = []
      const frameCount = 5 // 提取5个关键帧
      
      ffmpeg(videoPath)
        .on('end', () => resolve(keyframes))
        .on('error', reject)
        .screenshots({
          count: frameCount,
          folder: outputDir,
          filename: `frame_%i_${Date.now()}.jpg`,
          size: '320x240'
        })
        .on('filenames', (filenames) => {
          filenames.forEach((filename, index) => {
            keyframes.push({
              index: index + 1,
              filename,
              path: path.join(outputDir, filename),
              timestamp: (index / frameCount) * 100 // 假设视频100秒
            })
          })
        })
    })
  }

  /**
   * 从视频中提取音频
   * @param {String} videoPath - 视频文件路径
   * @param {String} audioPath - 输出音频路径
   * @returns {Promise<void>}
   */
  async extractAudioFromVideo(videoPath, audioPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .audioChannels(1)
        .audioFrequency(16000)
        .format('wav')
        .on('end', resolve)
        .on('error', reject)
        .save(audioPath)
    })
  }

  /**
   * 提取视频字幕
   * @param {String} videoPath - 视频文件路径
   * @param {String} outputDir - 输出目录
   * @returns {Promise<Array>} 字幕信息
   */
  async extractSubtitles(videoPath, outputDir) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          resolve([]) // 没有字幕文件时返回空数组
          return
        }
        
        const subtitleStreams = metadata.streams.filter(stream => 
          stream.codec_type === 'subtitle'
        )
        
        if (subtitleStreams.length === 0) {
          resolve([])
          return
        }
        
        // 提取字幕文件
        const subtitlePath = path.join(outputDir, `subtitle_${Date.now()}.srt`)
        
        ffmpeg(videoPath)
          .outputOptions(['-map', `0:${subtitleStreams[0].index}`])
          .output(subtitlePath)
          .on('end', async () => {
            try {
              const subtitleContent = await fs.readFile(subtitlePath, 'utf8')
              const subtitles = this.parseSRT(subtitleContent)
              await fs.unlink(subtitlePath).catch(() => {})
              resolve(subtitles)
            } catch (error) {
              resolve([])
            }
          })
          .on('error', () => resolve([]))
          .run()
      })
    })
  }

  /**
   * 解析SRT字幕文件
   * @param {String} srtContent - SRT文件内容
   * @returns {Array} 字幕数组
   */
  parseSRT(srtContent) {
    const subtitles = []
    const blocks = srtContent.split(/\n\s*\n/)
    
    blocks.forEach(block => {
      const lines = block.trim().split('\n')
      if (lines.length >= 3) {
        const index = parseInt(lines[0])
        const timeRange = lines[1]
        const text = lines.slice(2).join('\n')
        
        // 解析时间范围
        const timeMatch = timeRange.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/)
        if (timeMatch) {
          subtitles.push({
            index,
            startTime: timeMatch[1],
            endTime: timeMatch[2],
            text: text.trim()
          })
        }
      }
    })
    
    return subtitles
  }
}

// 单例模式
let instance = null

export function getMultimodalParser() {
  if (!instance) {
    instance = new MultimodalParser()
  }
  return instance
}

export default MultimodalParser

