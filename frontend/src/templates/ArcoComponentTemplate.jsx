/**
 * Arco Design 组件标准使用模板
 * 
 * 正确的导入方式：
 */
import { 
  Button, 
  Form, 
  Input, 
  Message,  // 避免使用，改用 Notification
  Notification,  // 推荐
  Modal,
  Card,
  Table,
  Select,
  DatePicker,
} from '@arco-design/web-react'

// 图标导入
import { IconUser, IconLock } from '@arco-design/web-react/icon'

/**
 * 正确的组件使用方式
 */
function ArcoTemplate() {
  // 1. Form 使用方式
  const [form] = Form.useForm()
  
  const handleSubmit = (values) => {
    // 使用 Notification 替代 Message
    Notification.success({
      title: '成功',
      content: '操作成功',
      duration: 3000
    })
  }

  return (
    <div>
      {/* 2. Form 组件 */}
      <Form
        form={form}
        layout="vertical"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          field="username"  // 注意：使用 field 不是 name
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            prefix={<IconUser />}
            placeholder="请输入"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" long>
            提交
          </Button>
        </Form.Item>
      </Form>

      {/* 3. Card 组件 */}
      <Card 
        title="标题"
        bordered
        hoverable
        style={{ width: 300 }}
      >
        内容
      </Card>

      {/* 4. Modal 使用方式 */}
      <Button 
        onClick={() => {
          Modal.confirm({
            title: '确认',
            content: '确定要执行此操作吗？',
            onOk: () => {
              Notification.success({
                title: '成功',
                content: '操作已完成'
              })
            }
          })
        }}
      >
        打开对话框
      </Button>
    </div>
  )
}

export default ArcoTemplate
