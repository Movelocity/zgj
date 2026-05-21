# Main Branch Go Resume Extraction Structure

本文记录 `main` 分支中 Go 后端对简历文件提取、结构化解析和 `structured_data` 存储格式的实际行为。

## 结论

`main` 分支 Go 后端本身不定义强类型的简历 JSON schema。它主要负责：

1. 调用 `doc_extract` 工作流，把上传文件提取为纯文本，并保存到 `resume_records.text_content`。
2. 调用 `resume_structure` 工作流，把纯文本结构化为 JSON 字符串。
3. 从工作流 `outputs.output` 中截取合法 JSON，并原样保存到 `resume_records.structured_data`。

因此，`structured_data` 的具体字段结构不是 Go struct 强约束出来的，而是由工作流输出、前端 V2 类型和项目文档共同约定。

## 数据库存储字段

`resume_records` 中与简历提取相关的核心字段如下：

```go
type ResumeRecord struct {
    TextContent    string `gorm:"type:text" json:"text_content"`
    StructuredData JSON   `gorm:"type:jsonb" json:"structured_data"`
    PendingContent JSON   `gorm:"type:jsonb" json:"pending_content"`
    Metadata       JSON   `gorm:"type:jsonb" json:"metadata"`
    PortraitImg    string `gorm:"size:512" json:"portrait_img"`
}
```

## Go 工作流链路

### 1. 文件转文本：`doc_extract`

Go 后端读取简历关联文件的 Dify 文件 ID，然后调用名为 `doc_extract` 的工作流。

输入结构：

```json
{
  "doc_file": {
    "transfer_method": "local_file",
    "upload_file_id": "DIFY_FILE_ID",
    "type": "document"
  }
}
```

期望工作流响应中存在：

```json
{
  "outputs": {
    "output": "简历纯文本内容"
  }
}
```

保存结果：

```json
{
  "text_content": "简历纯文本内容"
}
```

### 2. 文本转 JSON：`resume_structure`

Go 后端把 `text_content` 传给名为 `resume_structure` 的工作流。

输入结构：

```json
{
  "text_content": "简历纯文本内容"
}
```

期望工作流响应中存在：

```json
{
  "outputs": {
    "output": "{\"version\":2,\"blocks\":[]}"
  }
}
```

Go 会从 `outputs.output` 字符串中提取第一个合法 JSON 对象或数组，然后保存到：

```json
{
  "structured_data": {
    "version": 2,
    "blocks": []
  }
}
```

## API 详情返回结构

简历详情接口返回结构中，`structured_data` 是动态 JSON：

```json
{
  "id": "",
  "resume_number": "",
  "version": 1,
  "name": "",
  "original_filename": "",
  "file_id": "",
  "text_content": "",
  "structured_data": {},
  "pending_content": null,
  "metadata": null,
  "status": "active",
  "created_at": "",
  "updated_at": ""
}
```

## V2 `structured_data` 约定结构

主分支前端类型和文档约定的结构化简历格式是 V2 blocks 结构：

```json
{
  "version": 2,
  "portrait_img": "",
  "blocks": [
    {
      "title": "个人信息",
      "type": "object",
      "data": {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "title": "",
        "photo": ""
      }
    },
    {
      "title": "个人总结",
      "type": "text",
      "data": ""
    },
    {
      "title": "工作经历",
      "type": "list",
      "data": [
        {
          "id": "work-1",
          "name": "公司/项目/学校名称",
          "description": "经历描述",
          "time": "起止时间",
          "highlight": "亮点关键词"
        }
      ]
    },
    {
      "title": "专业技能",
      "type": "text",
      "data": "技能分类：技能A、技能B、技能C\n工具平台：工具A、工具B\n语言能力：中文、英文"
    }
  ]
}
```

## 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `version` | number | 结构化简历版本，目前 V2 为 `2` |
| `portrait_img` | string | 证件照或头像 URL，可为空 |
| `blocks` | array | 简历模块列表 |
| `blocks[].title` | string | 模块标题，例如 `个人信息`、`工作经历`、`教育背景` |
| `blocks[].type` | string | 模块类型，支持 `object`、`text`、`list` |
| `blocks[].data` | object/string/array | 根据模块类型变化的数据内容 |

## 常见模块

V2 结构没有固定的顶层 `skills`、`work_experience`、`education` 字段，而是通过 `blocks[].title` 表达不同简历模块。

常见模块示例：

| 模块 | 推荐结构 |
| --- | --- |
| 个人信息 | `title: "个人信息"`，`type: "object"` |
| 个人总结 | `title: "个人总结"`，`type: "text"` |
| 工作经历 | `title: "工作经历"`，`type: "list"` |
| 项目经历 | `title: "项目经历"`，`type: "list"` |
| 教育背景 | `title: "教育背景"`，`type: "list"` |
| 专业技能 | `title: "专业技能"`，`type: "text"` 或 `type: "list"` |

## Block 类型

### `object`

主要用于个人信息。

```json
{
  "title": "个人信息",
  "type": "object",
  "data": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "title": "",
    "photo": ""
  }
}
```

### `text`

用于个人总结、专业技能等纯文本模块。

```json
{
  "title": "个人总结",
  "type": "text",
  "data": "这里是文本内容"
}
```

专业技能也可以使用 `text`：

```json
{
  "title": "专业技能",
  "type": "text",
  "data": "数据分析：Excel、SQL、Python\n项目管理：需求拆解、进度推进、跨部门协作\n语言能力：英语六级"
}
```

### `list`

用于工作经历、项目经历、教育背景等列表模块。

```json
{
  "title": "项目经历",
  "type": "list",
  "data": [
    {
      "id": "project-1",
      "name": "项目名称",
      "description": "项目描述、职责、成果",
      "time": "起止时间",
      "highlight": "亮点关键词"
    }
  ]
}
```

## 注意事项

- Go 后端只校验能否从工作流输出中提取出合法 JSON，不校验它是否严格符合 V2 schema。
- 如果工作流输出了额外文本，Go 会尝试从第一个 `{` 或 `[` 开始截取合法 JSON。
- `structured_data` 存储在 PostgreSQL JSONB 字段中。
- 前端主要通过 `structured_data.version === 2` 和 `blocks` 来识别 V2 简历结构。
- `portrait_img` 同时可能存在于数据库独立字段和 `structured_data.portrait_img` 中。
