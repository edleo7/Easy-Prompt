import React, { useState } from 'react';
import { Table, Pagination, DatePicker, Select } from '@arco-design/web-react';
import { IconHistory } from '@arco-design/web-react/icon';

const UsageDetails = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState([]);
  const [serviceType, setServiceType] = useState('all');

  // 模拟数据
  const usageData = [
    {
      id: 1,
      serviceName: '文本生成',
      usageCount: 120,
      tokens: 24500,
      cost: 0.25,
      date: '2023-06-15',
      status: '成功'
    },
    {
      id: 2,
      serviceName: '代码生成',
      usageCount: 85,
      tokens: 18700,
      cost: 0.18,
      date: '2023-06-15',
      status: '成功'
    },
    {
      id: 3,
      serviceName: '问答系统',
      usageCount: 210,
      tokens: 32400,
      cost: 0.32,
      date: '2023-06-14',
      status: '成功'
    },
    {
      id: 4,
      serviceName: '文本摘要',
      usageCount: 65,
      tokens: 12300,
      cost: 0.12,
      date: '2023-06-14',
      status: '失败'
    },
    {
      id: 5,
      serviceName: '翻译服务',
      usageCount: 98,
      tokens: 21500,
      cost: 0.21,
      date: '2023-06-13',
      status: '成功'
    },
    {
      id: 6,
      serviceName: '文本生成',
      usageCount: 150,
      tokens: 29800,
      cost: 0.30,
      date: '2023-06-13',
      status: '成功'
    },
    {
      id: 7,
      serviceName: '代码生成',
      usageCount: 72,
      tokens: 15600,
      cost: 0.16,
      date: '2023-06-12',
      status: '成功'
    },
    {
      id: 8,
      serviceName: '问答系统',
      usageCount: 180,
      tokens: 38700,
      cost: 0.39,
      date: '2023-06-12',
      status: '成功'
    },
    {
      id: 9,
      serviceName: '文本摘要',
      usageCount: 45,
      tokens: 8700,
      cost: 0.09,
      date: '2023-06-11',
      status: '成功'
    },
    {
      id: 10,
      serviceName: '翻译服务',
      usageCount: 112,
      tokens: 24600,
      cost: 0.25,
      date: '2023-06-11',
      status: '失败'
    }
  ];

  const columns = [
    {
      title: '服务名称',
      dataIndex: 'serviceName',
      width: 150,
    },
    {
      title: '调用次数',
      dataIndex: 'usageCount',
      width: 120,
      render: (value) => `${value} 次`
    },
    {
      title: 'Token 消耗',
      dataIndex: 'tokens',
      width: 150,
      render: (value) => `${value.toLocaleString()} tokens`
    },
    {
      title: '费用',
      dataIndex: 'cost',
      width: 100,
      render: (value) => `¥${value.toFixed(2)}`
    },
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value) => (
        <span style={{ 
          color: value === '成功' ? '#00b42a' : '#f53f3f',
          fontWeight: 500
        }}>
          {value}
        </span>
      )
    }
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        使用明细
      </h2>
      
      {/* 筛选区域 */}
      <div style={{ 
        display: 'flex', 
        gap: 24, 
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 8, whiteSpace: 'nowrap' }}>日期范围:</span>
          <DatePicker.RangePicker 
            style={{ width: 240 }}
            value={dateRange}
            onChange={(value) => setDateRange(value)}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 8, whiteSpace: 'nowrap' }}>服务类型:</span>
          <Select
            style={{ width: 150 }}
            value={serviceType}
            onChange={(value) => setServiceType(value)}
          >
            <Select.Option value="all">全部</Select.Option>
            <Select.Option value="text-generation">文本生成</Select.Option>
            <Select.Option value="code-generation">代码生成</Select.Option>
            <Select.Option value="qa">问答系统</Select.Option>
            <Select.Option value="translation">翻译服务</Select.Option>
            <Select.Option value="summarization">文本摘要</Select.Option>
          </Select>
        </div>
      </div>
      
      {/* 表格 */}
      <Table
        columns={columns}
        data={usageData}
        pagination={false}
        // 移除了scroll属性以去掉内部滚动条
        rowKey="id"
        stripe
        border={{ wrapper: true, cell: true }}
      />
      
      {/* 分页器 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginTop: 20 
      }}>
        <Pagination
          sizeOptions={[10, 20, 50]}
          sizeCanChange
          current={currentPage}
          pageSize={pageSize}
          total={50}
          onChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
};

export default UsageDetails;