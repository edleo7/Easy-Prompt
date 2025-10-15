/**
 * 云存储服务抽象层
 * 支持：本地存储、阿里云OSS、腾讯云COS
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class CloudStorageService {
  constructor() {
    this.provider = process.env.CLOUD_STORAGE_PROVIDER || 'local'
    this.config = {
      local: {
        uploadPath: process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../../../uploads')
      },
      aliyun: {
        region: process.env.ALIYUN_OSS_REGION,
        accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
        bucket: process.env.ALIYUN_OSS_BUCKET
      },
      tencent: {
        secretId: process.env.TENCENT_SECRET_ID,
        secretKey: process.env.TENCENT_SECRET_KEY,
        bucket: process.env.TENCENT_COS_BUCKET,
        region: process.env.TENCENT_COS_REGION
      }
    }
    
    this.client = null
    this.initProvider()
  }

  /**
   * 初始化存储提供商
   */
  async initProvider() {
    try {
      switch (this.provider) {
        case 'aliyun':
          await this.initAliyun()
          break
        case 'tencent':
          await this.initTencent()
          break
        case 'local':
        default:
          await this.initLocal()
          break
      }
      console.log(`✅ 云存储服务初始化完成: ${this.provider}`)
    } catch (error) {
      console.error(`❌ 云存储服务初始化失败:`, error.message)
      // 降级到本地存储
      if (this.provider !== 'local') {
        console.log('⚠️ 降级到本地存储')
        this.provider = 'local'
        await this.initLocal()
      }
    }
  }

  /**
   * 初始化本地存储
   */
  async initLocal() {
    const uploadPath = this.config.local.uploadPath
    try {
      await fs.access(uploadPath)
    } catch {
      await fs.mkdir(uploadPath, { recursive: true })
    }
    console.log(`📁 本地存储路径: ${uploadPath}`)
  }

  /**
   * 初始化阿里云OSS
   */
  async initAliyun() {
    const OSS = (await import('ali-oss')).default
    const config = this.config.aliyun
    
    if (!config.accessKeyId || !config.accessKeySecret || !config.bucket) {
      throw new Error('阿里云OSS配置不完整')
    }

    this.client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket
    })
  }

  /**
   * 初始化腾讯云COS
   */
  async initTencent() {
    const COS = (await import('cos-nodejs-sdk-v5')).default
    const config = this.config.tencent
    
    if (!config.secretId || !config.secretKey || !config.bucket) {
      throw new Error('腾讯云COS配置不完整')
    }

    this.client = new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey
    })
    this.bucket = config.bucket
    this.region = config.region
  }

  /**
   * 上传文件
   * @param {Buffer|Stream} fileData - 文件数据
   * @param {Object} options - 上传选项
   * @returns {Promise<Object>} 上传结果 { url, key, size }
   */
  async upload(fileData, options = {}) {
    const { fileName, mimeType, folder = 'files' } = options
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = path.extname(fileName)
    const key = `${folder}/${timestamp}-${randomStr}${ext}`

    switch (this.provider) {
      case 'aliyun':
        return await this.uploadToAliyun(fileData, key, mimeType)
      case 'tencent':
        return await this.uploadToTencent(fileData, key, mimeType)
      case 'local':
      default:
        return await this.uploadToLocal(fileData, key, fileName)
    }
  }

  /**
   * 上传到本地
   */
  async uploadToLocal(fileData, key, originalName) {
    const uploadPath = this.config.local.uploadPath
    const filePath = path.join(uploadPath, key)
    const dir = path.dirname(filePath)
    
    // 确保目录存在
    await fs.mkdir(dir, { recursive: true })
    
    // 写入文件
    await fs.writeFile(filePath, fileData)
    
    // 获取文件大小
    const stats = await fs.stat(filePath)
    
    return {
      url: `/uploads/${key}`,
      key: key,
      size: stats.size,
      provider: 'local'
    }
  }

  /**
   * 上传到阿里云OSS
   */
  async uploadToAliyun(fileData, key, mimeType) {
    const result = await this.client.put(key, fileData, {
      headers: {
        'Content-Type': mimeType || 'application/octet-stream'
      }
    })
    
    return {
      url: result.url,
      key: result.name,
      size: fileData.length,
      provider: 'aliyun'
    }
  }

  /**
   * 上传到腾讯云COS
   */
  async uploadToTencent(fileData, key, mimeType) {
    return new Promise((resolve, reject) => {
      this.client.putObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
        Body: fileData,
        ContentType: mimeType || 'application/octet-stream'
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            url: `https://${data.Location}`,
            key: key,
            size: fileData.length,
            provider: 'tencent'
          })
        }
      })
    })
  }

  /**
   * 下载文件
   * @param {String} key - 文件key
   * @returns {Promise<Buffer>} 文件数据
   */
  async download(key) {
    switch (this.provider) {
      case 'aliyun':
        return await this.downloadFromAliyun(key)
      case 'tencent':
        return await this.downloadFromTencent(key)
      case 'local':
      default:
        return await this.downloadFromLocal(key)
    }
  }

  /**
   * 从本地下载
   */
  async downloadFromLocal(key) {
    const uploadPath = this.config.local.uploadPath
    const filePath = path.join(uploadPath, key)
    return await fs.readFile(filePath)
  }

  /**
   * 从阿里云OSS下载
   */
  async downloadFromAliyun(key) {
    const result = await this.client.get(key)
    return result.content
  }

  /**
   * 从腾讯云COS下载
   */
  async downloadFromTencent(key) {
    return new Promise((resolve, reject) => {
      this.client.getObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: key
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data.Body)
        }
      })
    })
  }

  /**
   * 删除文件
   * @param {String} key - 文件key
   * @returns {Promise<Boolean>}
   */
  async delete(key) {
    try {
      switch (this.provider) {
        case 'aliyun':
          await this.client.delete(key)
          break
        case 'tencent':
          await new Promise((resolve, reject) => {
            this.client.deleteObject({
              Bucket: this.bucket,
              Region: this.region,
              Key: key
            }, (err, data) => {
              if (err) reject(err)
              else resolve(data)
            })
          })
          break
        case 'local':
        default:
          const uploadPath = this.config.local.uploadPath
          const filePath = path.join(uploadPath, key)
          await fs.unlink(filePath)
          break
      }
      return true
    } catch (error) {
      console.error(`删除文件失败: ${key}`, error)
      return false
    }
  }

  /**
   * 获取签名URL（临时访问链接）
   * @param {String} key - 文件key
   * @param {Number} expiresIn - 过期时间（秒）
   * @returns {Promise<String>} 签名URL
   */
  async getSignedUrl(key, expiresIn = 3600) {
    switch (this.provider) {
      case 'aliyun':
        return this.client.signatureUrl(key, { expires: expiresIn })
      case 'tencent':
        return new Promise((resolve, reject) => {
          this.client.getObjectUrl({
            Bucket: this.bucket,
            Region: this.region,
            Key: key,
            Sign: true,
            Expires: expiresIn
          }, (err, data) => {
            if (err) reject(err)
            else resolve(data.Url)
          })
        })
      case 'local':
      default:
        // 本地存储返回相对路径
        return `/uploads/${key}`
    }
  }

  /**
   * 批量删除文件
   * @param {Array<String>} keys - 文件key数组
   * @returns {Promise<Array>} 删除结果
   */
  async batchDelete(keys) {
    const results = await Promise.allSettled(
      keys.map(key => this.delete(key))
    )
    return results.map((result, index) => ({
      key: keys[index],
      success: result.status === 'fulfilled' && result.value
    }))
  }
}

// 单例模式
let instance = null

export function getCloudStorageService() {
  if (!instance) {
    instance = new CloudStorageService()
  }
  return instance
}

export default CloudStorageService

