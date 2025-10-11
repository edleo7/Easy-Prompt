import React, { useState } from 'react'
import { 
  Button, 
  Upload, 
  Card, 
  Typography, 
  Space, 
  Message, 
  Spin, 
  Divider,
  Tag,
  Row,
  Col,
  Input,
  Select,
  Switch
} from '@arco-design/web-react'
import { IconUpload, IconEye, IconCopy, IconDownload } from '@arco-design/web-react/icon'

const { Title, Text } = Typography
const { TextArea } = Input

export default function ImageOCR() {
  const [uploading, setUploading] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const [result, setResult] = useState(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [ocrOptions, setOcrOptions] = useState({
    includeLayout: true,
    includeTables: true,
    includeCode: true,
    language: ''
  })

  // 处理文件上传
  const handleUpload = async (file) => {
    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('prompt', customPrompt || '请识别图片中的所有文字内容')
      formData.append('options', JSON.stringify(ocrOptions))

      const response = await fetch('/api/v1/ocr/recognize', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.code === 200) {
        setResult(data.data)
        Message.success('OCR识别成功')
      } else {
        Message.error(data.message || 'OCR识别失败')
      }
    } catch (error) {
      console.error('OCR识别错误:', error)
      Message.error('OCR识别失败: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // 复制识别结果
  const handleCopy = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text)
      Message.success('已复制到剪贴板')
    }
  }

  // 下载识别结果
  const handleDownload = () => {
    if (result?.text) {
      const blob = new Blob([result.text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ocr-result-${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
      Message.success('已下载识别结果')
    }
  }

  // 支持的图片格式
  const supportedFormats = [
    'image/png',
    'image/jpeg', 
    'image/jpg',
    'image/bmp',
    'image/gif',
    'image/tiff',
    'image/webp',
    'image/heif',
    'image/heic'
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0, marginBottom: '8px' }}>
          🖼️ 图片OCR识别
        </Title>
        <Text type="secondary">
          使用DeepSeek多模态能力识别图片中的文字内容，支持多种图片格式
        </Text>
      </div>

      <Row gutter={24}>
        {/* 上传区域 */}
        <Col span={12}>
          <Card title="上传图片" style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                accept={supportedFormats.join(',')}
                beforeUpload={handleUpload}
                showUploadList={false}
                disabled={uploading || recognizing}
              >
                <div style={{
                  border: '2px dashed #d9d9d9',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}>
                  {uploading || recognizing ? (
                    <Spin size="large" />
                  ) : (
                    <>
                      <IconUpload style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                      <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                        点击或拖拽上传图片
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        支持 PNG、JPG、BMP、GIF、TIFF、WebP、HEIF、HEIC 格式
                      </div>
                    </>
                  )}
                </div>
              </Upload>

              <Divider />

              <div>
                <Text style={{ fontWeight: '500', marginBottom: '12px', display: 'block' }}>
                  识别选项
                </Text>
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text>保持布局格式</Text>
                    <Switch 
                      checked={ocrOptions.includeLayout}
                      onChange={(checked) => setOcrOptions(prev => ({ ...prev, includeLayout: checked }))}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text>识别表格内容</Text>
                    <Switch 
                      checked={ocrOptions.includeTables}
                      onChange={(checked) => setOcrOptions(prev => ({ ...prev, includeTables: checked }))}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text>识别代码块</Text>
                    <Switch 
                      checked={ocrOptions.includeCode}
                      onChange={(checked) => setOcrOptions(prev => ({ ...prev, includeCode: checked }))}
                    />
                  </div>

                  <div>
                    <Text style={{ marginBottom: '8px', display: 'block' }}>语言偏好</Text>
                    <Select
                      placeholder="选择主要语言（可选）"
                      value={ocrOptions.language}
                      onChange={(value) => setOcrOptions(prev => ({ ...prev, language: value }))}
                      style={{ width: '100%' }}
                      allowClear
                    >
                      <Select.Option value="zh">中文</Select.Option>
                      <Select.Option value="en">英文</Select.Option>
                      <Select.Option value="ja">日文</Select.Option>
                      <Select.Option value="ko">韩文</Select.Option>
                      <Select.Option value="fr">法文</Select.Option>
                      <Select.Option value="de">德文</Select.Option>
                      <Select.Option value="es">西班牙文</Select.Option>
                    </Select>
                  </div>

                  <div>
                    <Text style={{ marginBottom: '8px', display: 'block' }}>自定义提示词</Text>
                    <TextArea
                      placeholder="请输入自定义识别提示词（可选）"
                      value={customPrompt}
                      onChange={setCustomPrompt}
                      rows={3}
                    />
                  </div>
                </Space>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 识别结果 */}
        <Col span={12}>
          <Card 
            title="识别结果" 
            style={{ height: '100%' }}
            extra={
              result && (
                <Space>
                  <Button 
                    type="outline" 
                    size="small" 
                    icon={<IconCopy />}
                    onClick={handleCopy}
                  >
                    复制
                  </Button>
                  <Button 
                    type="outline" 
                    size="small" 
                    icon={<IconDownload />}
                    onClick={handleDownload}
                  >
                    下载
                  </Button>
                </Space>
              )
            }
          >
            {result ? (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <Space wrap>
                    <Tag color="blue">识别成功</Tag>
                    <Tag color="green">{result.originalFile.name}</Tag>
                    <Tag color="orange">{result.metadata.ocrModel}</Tag>
                    <Tag color="purple">{(result.originalFile.size / 1024).toFixed(1)} KB</Tag>
                  </Space>
                </div>

                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {result.text || '未识别到文字内容'}
                </div>

                {result.metadata && (
                  <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                    <div>处理时间: {new Date(result.metadata.processedAt).toLocaleString()}</div>
                    {result.metadata.usage && (
                      <div>Token使用: {result.metadata.usage.total_tokens || 'N/A'}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#999',
                padding: '40px 20px'
              }}>
                <IconEye style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>上传图片开始OCR识别</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
