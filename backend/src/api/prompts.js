import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// 生成Prompt
router.post('/generate', async (req, res) => {
  try {
    const { task, type, knowledgeIds, memoryIds, settings } = req.body
    const userId = 'default-user'

    if (!task || !type) {
      return res.status(400).json({
        code: 400,
        message: '请提供任务描述和类型',
        data: null
      })
    }

    // 获取知识库内容
    let knowledgeContent = []
    if (knowledgeIds && knowledgeIds.length > 0) {
      const knowledge = await prisma.knowledgeBase.findMany({
        where: {
          id: { in: knowledgeIds },
          workspace: {
            memberships: { some: { userId } }
          }
        },
        include: {
          files: {
            include: {
              chunks: true
            }
          }
        }
      })
      knowledgeContent = knowledge
    }

    // 获取记忆内容
    let memoryContent = []
    if (memoryIds && memoryIds.length > 0) {
      const memories = await prisma.memoryItem.findMany({
        where: {
          id: { in: memoryIds },
          OR: [
            { userId },
            { workspace: { memberships: { some: { userId } } } }
          ]
        }
      })
      memoryContent = memories
    }

    // 生成Prompt
    const prompt = generatePrompt({
      task,
      type,
      knowledge: knowledgeContent,
      memories: memoryContent,
      settings
    })

    res.json({
      code: 200,
      message: 'Prompt生成成功',
      data: {
        prompt,
        metadata: {
          knowledgeCount: knowledgeContent.length,
          memoryCount: memoryContent.length,
          settings
        }
      }
    })
  } catch (error) {
    console.error('生成Prompt错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 保存Prompt模板
router.post('/templates', async (req, res) => {
  try {
    const { name, type, systemText, userText, variables, workspaceId } = req.body
    const userId = 'default-user'

    if (!name || !type) {
      return res.status(400).json({
        code: 400,
        message: '请填写模板名称和类型',
        data: null
      })
    }

    const template = await prisma.template.create({
      data: {
        name,
        type,
        systemText,
        userText,
        variables: variables ? JSON.stringify(variables) : null,
        workspaceId: workspaceId || null
      }
    })

    res.status(201).json({
      code: 201,
      message: '模板保存成功',
      data: template
    })
  } catch (error) {
    console.error('保存模板错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 获取Prompt模板列表
router.get('/templates', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, workspaceId } = req.query
    const userId = 'default-user'

    const where = {
      workspace: {
        memberships: { some: { userId } }
      }
    }
    if (type) where.type = type
    if (workspaceId) where.workspaceId = workspaceId

    const templates = await prisma.template.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    })

    const total = await prisma.template.count({ where })

    res.json({
      code: 200,
      message: '获取模板列表成功',
      data: {
        templates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取模板列表错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 智能生成Prompt的核心算法
function generatePrompt({ task, type, knowledge, memories, settings }) {
  let prompt = ''
  
  // 根据任务类型选择基础模板
  if (type === '文本理解') {
    prompt = '你是一位专业的文本分析专家，请基于以下要求分析文本内容：\n\n'
  } else if (type === '视觉理解') {
    prompt = '你是一位专业的图像分析专家，请基于以下要求分析图像内容：\n\n'
  } else if (type === '多轮对话') {
    prompt = '你是一位专业的对话助手，请基于以下要求进行对话：\n\n'
  }

  // 添加任务描述
  prompt += `任务描述：${task}\n\n`

  // 添加知识库内容
  if (knowledge && knowledge.length > 0 && settings?.useKnowledge) {
    prompt += '相关背景知识：\n'
    knowledge.forEach(kb => {
      prompt += `- ${kb.name}: ${kb.description}\n`
      // 添加文件内容
      if (kb.files && kb.files.length > 0) {
        kb.files.forEach(file => {
          if (file.chunks && file.chunks.length > 0) {
            const content = file.chunks.map(chunk => chunk.text).join(' ')
            prompt += `  - ${file.name}: ${content.substring(0, 500)}...\n`
          }
        })
      }
    })
    prompt += '\n'
  }

  // 添加记忆内容
  if (memories && memories.length > 0 && settings?.useMemory) {
    prompt += '用户偏好和习惯：\n'
    memories.forEach(memory => {
      const tags = JSON.parse(memory.tags || '[]')
      prompt += `- ${memory.content}`
      if (tags.length > 0) {
        prompt += ` (标签: ${tags.join(', ')})`
      }
      prompt += '\n'
    })
    prompt += '\n'
  }

  // 添加输出格式要求
  if (settings?.outputFormat === 'markdown') {
    prompt += '请使用Markdown格式输出结果。\n\n'
  } else if (settings?.outputFormat === 'json') {
    prompt += '请使用JSON格式输出结果。\n\n'
  }

  // 添加具体指令
  prompt += '请按照以下步骤执行：\n'
  prompt += '1. 仔细分析任务要求\n'
  prompt += '2. 结合提供的背景知识\n'
  prompt += '3. 考虑用户偏好和习惯\n'
  prompt += '4. 提供详细、准确的回答\n'
  prompt += '5. 确保回答符合专业标准'

  return prompt
}

export default router