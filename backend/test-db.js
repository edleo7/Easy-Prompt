import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
})

async function testDatabase() {
  try {
    console.log('测试数据库连接...')
    
    // 测试查询
    const count = await prisma.task.count()
    console.log('✅ 数据库连接成功！')
    console.log(`📊 Task表记录数: ${count}`)
    
    // 测试查询所有工作空间
    const workspaces = await prisma.workspace.findMany({ take: 5 })
    console.log(`📁 Workspace数量: ${workspaces.length}`)
    
    await prisma.$disconnect()
    console.log('✅ 测试完成')
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message)
    console.error('详细错误:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

testDatabase()

