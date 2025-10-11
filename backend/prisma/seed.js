import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始种子数据...')

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: '测试用户',
      avatarUrl: null
    }
  })

  console.log('✅ 创建用户:', user.email)

  // 创建测试工作空间
  const workspace = await prisma.workspace.upsert({
    where: { id: 'test-workspace-1' },
    update: {},
    create: {
      id: 'test-workspace-1',
      name: '默认工作空间',
      ownerId: user.id
    }
  })

  console.log('✅ 创建工作空间:', workspace.name)

  // 创建测试项目
  const projects = [
    {
      name: '教育题目答案批改输出',
      type: 'VISION',
      workspaceId: workspace.id,
      createdById: user.id,
      variables: JSON.stringify(['subject', 'difficulty'])
    },
    {
      name: '撰写回复投诉邮件',
      type: 'PROMPT',
      workspaceId: workspace.id,
      createdById: user.id,
      variables: JSON.stringify(['complaint_type', 'severity'])
    },
    {
      name: '生成客服对话内容',
      type: 'CHAT',
      workspaceId: workspace.id,
      createdById: user.id,
      variables: JSON.stringify(['customer_type', 'issue_category'])
    }
  ]

  for (const projectData of projects) {
    const project = await prisma.task.create({
      data: projectData
    })
    console.log('✅ 创建项目:', project.name)
  }

  // 创建测试记忆
  const memories = [
    {
      content: '用户偏好使用简洁明了的语言风格',
      scope: 'USER',
      userId: user.id,
      weight: 'HIGH',
      tags: JSON.stringify(['语言风格', '偏好'])
    },
    {
      content: '团队通常处理教育相关的AI应用',
      scope: 'WORKSPACE',
      workspaceId: workspace.id,
      weight: 'NORMAL',
      tags: JSON.stringify(['教育', '团队'])
    },
    {
      content: '客户服务场景中需要保持专业和友好的语调',
      scope: 'WORKSPACE',
      workspaceId: workspace.id,
      weight: 'HIGH',
      tags: JSON.stringify(['客服', '语调'])
    }
  ]

  for (const memoryData of memories) {
    const memory = await prisma.memoryItem.create({
      data: memoryData
    })
    console.log('✅ 创建记忆:', memory.content.substring(0, 20) + '...')
  }

  // 创建测试知识库
  const knowledgeBase = await prisma.knowledgeBase.create({
    data: {
      name: '教育知识库',
      description: '包含教育相关的背景知识和最佳实践',
      workspaceId: workspace.id
    }
  })

  console.log('✅ 创建知识库:', knowledgeBase.name)

  // 创建测试文件
  const file = await prisma.file.create({
    data: {
      name: '教育最佳实践.md',
      mimeType: 'text/markdown',
      size: 1024,
      storageUrl: '/uploads/education-best-practices.md',
      kbId: knowledgeBase.id
    }
  })

  console.log('✅ 创建文件:', file.name)

  // 创建文档块
  await prisma.docChunk.create({
    data: {
      fileId: file.id,
      idx: 0,
      text: '教育AI应用的最佳实践包括：1. 个性化学习路径 2. 实时反馈机制 3. 多模态交互',
      metadata: JSON.stringify({ type: 'best_practices', category: 'education' })
    }
  })

  console.log('✅ 创建文档块')

  console.log('🎉 种子数据创建完成！')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
