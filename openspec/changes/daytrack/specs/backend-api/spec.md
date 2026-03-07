# Backend API 规范

## 概述

Node.js + Express 后端，提供 RESTful API。

## 功能需求

### 1. 技术栈
- **后端框架**：Express
- **跨域支持**：CORS 中间件
- **错误处理**：统一错误处理中间件
- **日志记录**：基础日志记录

### 2. API 端点设计

```
# 工作痕迹 API
GET    /api/traces              # 获取工作痕迹列表
POST   /api/traces              # 创建工作痕迹（手动输入）
GET    /api/traces/:id          # 获取单个工作痕迹
DELETE /api/traces/:id          # 删除工作痕迹

# 日报 API
GET    /api/reports             # 获取日报列表
GET    /api/reports/:date       # 获取某一天的日报
POST   /api/reports/:date/generate  # 生成日报
PUT    /api/reports/:date       # 编辑日报

# 配置 API
GET    /api/config              # 获取配置
PUT    /api/config              # 更新配置

# 采集 API
POST   /api/collect/git         # 手动触发 git 采集
POST   /api/collect/all         # 手动触发所有采集
```

### 3. API 响应格式

```typescript
// 通用响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 列表响应格式
interface ListResponse<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

// 示例：获取日报列表响应
GET /api/reports
{
  "success": true,
  "data": {
    "items": [
      { "id": "...", "date": "2026-03-03", ... },
      ...
    ],
    "total": 30
  }
}

// 示例：错误响应
{
  "success": false,
  "error": "Failed to generate report: API key not configured"
}
```

### 4. 中间件

- **CORS**：允许前端跨域访问
- **JSON 解析**：express.json()
- **错误处理**：统一错误处理中间件
- **日志**：基础请求日志
- **认证**：第一期不需要（本地运行）

## 非功能需求

- 性能：响应快速
- 可靠性：错误处理完善
- 简单性：API 设计简单直观

## 扩展点

- 未来可以添加认证机制（如果需要远程访问）
- 未来可以添加 WebSocket 支持（实时更新）
- 未来可以添加 API 文档（Swagger/OpenAPI）
