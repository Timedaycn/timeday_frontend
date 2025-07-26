# TZY架构师开发策略 - 锚点突击战略文档中心

## 📋 文档架构说明

本目录包含完整的锚点突击战略管理体系：

### 📁 目录结构

```
docs/
├── anchors/           # 锚点管理
│   ├── mp/           # Milestone Point 文档
│   └── README.md     # 锚点说明
├── missions/         # 突击任务
│   ├── dv/          # Development 任务文档
│   ├── failed/      # 失败任务档案
│   └── templates/   # 文档模板
├── strategy/        # 战略管理
│   ├── BRANCHES.md  # 分支状态追踪
│   ├── NAMING.md    # 命名规范
│   └── WORKFLOW.md  # 工作流程
└── scripts/         # 自动化脚本
    ├── start-mission.sh
    ├── abort-mission.sh
    └── create-anchor.sh
```

### 🎯 核心理念

**锚点突击 = 稳定锚点 + 零成本试错 + 快速回退 + 重新规划**

- **BP锚点**：绝对稳定的代码状态
- **DV突击**：基于锚点的快速试错分支
- **快速回退**：问题出现立即回到锚点
- **详细日志**：记录每次突击的经验教训

### 📖 使用指南

1. 查看 `strategy/WORKFLOW.md` 了解完整工作流程
2. 参考 `strategy/NAMING.md` 学习命名规范
3. 使用 `scripts/` 中的自动化脚本
4. 在 `missions/dv/` 中记录开发任务
5. 在 `anchors/mp/` 中维护锚点状态

---
*TZY架构师开发策略 v2.0 - 锚点突击战略*