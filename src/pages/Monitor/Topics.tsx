import { useEffect, useMemo, useState } from 'react'
import { Button, Empty, Tabs, Tag } from 'antd'
import { BulbOutlined, EditOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import type { TopicCircleMonitorTopic, TopicCirclePostLeaderboardItem, TopicCircleTopicPost } from '../../api/topicCircle'
import {
  CustomGroupAccountsDrawer,
  CustomGroupDetail,
  CustomGroupEditorDrawer,
  CustomGroupManagerDrawer,
  SourceAccountFilter,
  getMatchedAccounts,
  inferAccountType,
  useCustomMonitoringGroups,
  type AccountType,
  type CustomMonitoringGroup,
} from './CustomMonitoringGroups'
import styles from './Monitor.module.css'

type BoardMode = 'all' | 'circle' | 'global' | 'rising'

const BOARD_MODES: { key: BoardMode; label: string; desc: string }[] = [
  { key: 'all', label: '全部', desc: '全部重点主题帖子 Top 10' },
  { key: 'circle', label: '圈内榜', desc: '当前主题圈帖子 Top 10' },
  { key: 'global', label: '全圈总榜', desc: '所有重点主题帖子 Top 10' },
  { key: 'rising', label: '热度飙升榜', desc: '按本轮新增浏览排序' },
]

const MOCK_CALCULATED_AT = '2026-09-04T14:54:00+08:00'

const MOCK_TOPICS: TopicCircleMonitorTopic[] = [
  {
    id: 'mock-ai-startup',
    name: 'AI创业',
    enabled: true,
    accountCount: 11,
    recentPostCount3h: 10,
    candidateCount24h: 11,
    triggeredEventCount24h: 4,
    latestCandidates: [],
  },
  {
    id: 'mock-ai-product',
    name: 'AI 产品机会追踪',
    enabled: true,
    accountCount: 9,
    recentPostCount3h: 8,
    candidateCount24h: 10,
    triggeredEventCount24h: 3,
    latestCandidates: [],
  },
  {
    id: 'mock-web3',
    name: 'Crypto 与 Web3',
    enabled: true,
    accountCount: 8,
    recentPostCount3h: 7,
    candidateCount24h: 10,
    triggeredEventCount24h: 2,
    latestCandidates: [],
  },
]

const MOCK_LEADERBOARD_POSTS: TopicCirclePostLeaderboardItem[] = [
  createMockPost({
    rank: 1,
    signalId: 'mock-ai-001',
    topicWatchId: 'mock-ai-startup',
    topicWatchName: 'AI创业',
    authorHandle: '@OpenAI',
    authorName: 'OpenAI',
    text: 'OpenAI 发布了一条与 AI 创业相关的新动态：创业热门项目、机会窗口和当前融资环境正在被新一轮模型能力重塑。',
    views: 4934000,
    likes: 105000,
    replies: 1600,
    reposts: 6800,
    deltaViews: 543000,
    previousRank: 5,
    status: 'hot_event_candidate',
    publishedAt: '2026-09-04T13:12:00+08:00',
  }),
  createMockPost({
    rank: 2,
    signalId: 'mock-ai-002',
    topicWatchId: 'mock-ai-startup',
    topicWatchName: 'AI创业',
    authorHandle: '@AnthropicAI',
    authorName: 'Anthropic',
    text: 'Anthropic 发布了一条与 AI 创业相关的新动态：企业级 Agent 项目正在从演示走向真实工作流，垂直场景是下一阶段重点。',
    views: 3173000,
    likes: 83200,
    replies: 1220,
    reposts: 5100,
    deltaViews: 254000,
    previousRank: 6,
    status: 'hot_event_candidate',
    publishedAt: '2026-09-04T12:55:00+08:00',
  }),
  createMockPost({
    rank: 3,
    signalId: 'mock-ai-003',
    topicWatchId: 'mock-ai-startup',
    topicWatchName: 'AI创业',
    authorHandle: '@Reuters',
    authorName: 'Reuters',
    text: 'Reuters 观察到 AI 创业公司融资节奏回暖，基础设施、应用层和数据服务成为投资人讨论最集中的方向。',
    views: 2410000,
    likes: 49800,
    replies: 820,
    reposts: 3900,
    deltaViews: 221000,
    previousRank: 4,
    status: 'hot_event_candidate',
    publishedAt: '2026-09-04T13:46:00+08:00',
  }),
  createMockPost({
    rank: 4,
    signalId: 'mock-ai-004',
    topicWatchId: 'mock-ai-product',
    topicWatchName: 'AI 产品机会追踪',
    authorHandle: '@levelsio',
    authorName: 'Pieter Levels',
    text: '小团队用 AI 工具快速上线产品，关键不再是功能堆叠，而是找到用户每天都会重复打开的高频场景。',
    views: 1280000,
    likes: 38500,
    replies: 540,
    reposts: 2100,
    deltaViews: 184000,
    previousRank: 8,
    status: 'watching',
    publishedAt: '2026-09-04T12:18:00+08:00',
  }),
  createMockPost({
    rank: 5,
    signalId: 'mock-ai-005',
    topicWatchId: 'mock-ai-product',
    topicWatchName: 'AI 产品机会追踪',
    authorHandle: '@ProductHunt',
    authorName: 'Product Hunt',
    text: '本周上榜 AI 产品里，知识库问答、销售助手和视频生成工具获得最高讨论量，团队正在寻找更清晰的留存信号。',
    views: 968000,
    likes: 22100,
    replies: 330,
    reposts: 1400,
    deltaViews: 99000,
    previousRank: 7,
    status: 'watching',
    publishedAt: '2026-09-04T11:40:00+08:00',
  }),
  createMockPost({
    rank: 6,
    signalId: 'mock-ai-006',
    topicWatchId: 'mock-ai-startup',
    topicWatchName: 'AI创业',
    authorHandle: '@sama',
    authorName: 'Sam Altman',
    text: '创业公司会因为 AI 获得更快的试错速度，但真正的护城河仍然来自分发、数据飞轮和用户信任。',
    views: 824000,
    likes: 31200,
    replies: 470,
    reposts: 1800,
    deltaViews: 87500,
    previousRank: 3,
    status: 'hot_event_candidate',
    publishedAt: '2026-09-04T10:35:00+08:00',
  }),
  createMockPost({
    rank: 7,
    signalId: 'mock-web3-001',
    topicWatchId: 'mock-web3',
    topicWatchName: 'Crypto 与 Web3',
    authorHandle: '@VitalikButerin',
    authorName: 'Vitalik Buterin',
    text: 'Web3 应用如果想进入主流市场，需要把复杂链上概念隐藏在更自然的用户体验之后。',
    views: 711000,
    likes: 18900,
    replies: 680,
    reposts: 1200,
    deltaViews: 132000,
    previousRank: 12,
    status: 'watching',
    publishedAt: '2026-09-04T13:02:00+08:00',
  }),
  createMockPost({
    rank: 8,
    signalId: 'mock-ai-007',
    topicWatchId: 'mock-ai-product',
    topicWatchName: 'AI 产品机会追踪',
    authorHandle: '@a16z',
    authorName: 'a16z',
    text: 'AI 应用层机会正在从“通用助手”迁移到“嵌入具体岗位的工作台”，产品体验和行业数据成为关键变量。',
    views: 683000,
    likes: 16400,
    replies: 290,
    reposts: 980,
    deltaViews: 73000,
    previousRank: 9,
    status: 'watching',
    publishedAt: '2026-09-04T09:56:00+08:00',
  }),
  createMockPost({
    rank: 9,
    signalId: 'mock-web3-002',
    topicWatchId: 'mock-web3',
    topicWatchName: 'Crypto 与 Web3',
    authorHandle: '@CoinDesk',
    authorName: 'CoinDesk',
    text: '稳定币支付和链上结算再次成为创业者讨论焦点，区域支付场景开始出现更具体的落地案例。',
    views: 522000,
    likes: 9800,
    replies: 210,
    reposts: 760,
    deltaViews: 61000,
    previousRank: null,
    status: 'watching',
    publishedAt: '2026-09-04T11:08:00+08:00',
  }),
  createMockPost({
    rank: 10,
    signalId: 'mock-ai-008',
    topicWatchId: 'mock-ai-startup',
    topicWatchName: 'AI创业',
    authorHandle: '@ycombinator',
    authorName: 'Y Combinator',
    text: '新一批 AI 创业团队更强调真实收入和分发效率，投资人开始弱化单纯模型包装的故事。',
    views: 409000,
    likes: 12100,
    replies: 180,
    reposts: 620,
    deltaViews: 48800,
    previousRank: 10,
    status: 'watching',
    publishedAt: '2026-09-04T08:50:00+08:00',
  }),
]

export default function Topics({ timeRangeHours }: { timeRangeHours: number }) {
  const { topicDetail, toast } = useApp()
  const topics = MOCK_TOPICS
  const customGroups = useCustomMonitoringGroups()
  const [activeTopic, setActiveTopic] = useState<string | undefined>()
  const [activeCustomGroup, setActiveCustomGroup] = useState<string | undefined>()
  const [boardMode, setBoardMode] = useState<BoardMode>('circle')
  const [editorOpen, setEditorOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CustomMonitoringGroup | null>(null)
  const [accountsGroup, setAccountsGroup] = useState<CustomMonitoringGroup | null>(null)

  useEffect(() => {
    if (boardMode !== 'circle') {
      setActiveTopic(undefined)
      setActiveCustomGroup(undefined)
      return
    }

    if (activeCustomGroup && customGroups.groups.some((group) => group.id === activeCustomGroup)) {
      return
    }

    setActiveCustomGroup(undefined)

    if (!topics.length) {
      setActiveTopic(undefined)
      if (customGroups.groups.length) setActiveCustomGroup(customGroups.groups[0].id)
      return
    }

    setActiveTopic((current) =>
      current && topics.some((topic) => topic.name === current) ? current : topics[0].name,
    )
  }, [activeCustomGroup, boardMode, customGroups.groups, topics])

  const switchBoardMode = (mode: BoardMode) => {
    setBoardMode(mode)
    if (mode === 'circle') {
      setActiveCustomGroup(undefined)
      setActiveTopic((current) =>
        current && topics.some((topic) => topic.name === current) ? current : topics[0]?.name,
      )
      return
    }

    setActiveTopic(undefined)
    setActiveCustomGroup(undefined)
  }

  const switchTopic = (key: string) => {
    setBoardMode('circle')
    if (key.startsWith('custom:')) {
      setActiveCustomGroup(key.replace('custom:', ''))
      setActiveTopic(undefined)
      return
    }

    setActiveCustomGroup(undefined)
    setActiveTopic(key.replace('topic:', ''))
  }

  const openCreateGroup = () => {
    setEditingGroup(null)
    setEditorOpen(true)
  }

  const openEditGroup = (group: CustomMonitoringGroup) => {
    setManagerOpen(false)
    setEditingGroup(group)
    setEditorOpen(true)
  }

  const saveCustomGroup = (group: CustomMonitoringGroup) => {
    customGroups.saveGroup(group)
    setActiveCustomGroup(group.id)
    setActiveTopic(undefined)
    setBoardMode('circle')
    setEditorOpen(false)
    setEditingGroup(null)
    toast(group.enabled ? '监控群组已保存并开启' : '监控群组已保存为草稿')
  }

  const deleteCustomGroup = (id: string) => {
    customGroups.deleteGroup(id)
    if (activeCustomGroup === id) {
      const nextCustomGroup = customGroups.groups.find((group) => group.id !== id)
      setActiveCustomGroup(topics.length ? undefined : nextCustomGroup?.id)
      setActiveTopic(topics[0]?.name)
    }
    toast('监控群组已删除')
  }

  if (topicDetail) {
    return <TopicDetail name={topicDetail} topics={topics} timeRangeHours={timeRangeHours} />
  }

  const activeTabKey = activeCustomGroup
    ? `custom:${activeCustomGroup}`
    : activeTopic
      ? `topic:${activeTopic}`
      : undefined

  return (
    <>
      <div className={styles.topicModeBar}>
        <div className={styles.topicModeTabs}>
          {BOARD_MODES.map((mode) => (
            <Button
              key={mode.key}
              type={boardMode === mode.key ? 'primary' : 'default'}
              onClick={() => switchBoardMode(mode.key)}
            >
              {mode.label}
            </Button>
          ))}
        </div>
      </div>
      <Tabs
        className={styles.topicTabs}
        activeKey={boardMode === 'circle' ? activeTabKey : ''}
        onChange={switchTopic}
        tabBarExtraContent={{
          right: (
            <div className={styles.createGroupButton}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateGroup}>
                新建群组
              </Button>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                aria-label="管理群组"
                onClick={() => setManagerOpen(true)}
              />
            </div>
          ),
        }}
        items={[
          ...topics.map((topic) => ({
            key: `topic:${topic.name}`,
            label: (
              <span>
                {topic.name}
                <small>{topic.candidateCount24h}</small>
              </span>
            ),
            children: (
              <TopicDetail
                name={topic.name}
                topics={topics}
                embedded
                summary={topic}
                boardMode={boardMode}
                timeRangeHours={timeRangeHours}
              />
            ),
          })),
          ...customGroups.groups.map((group) => ({
            key: `custom:${group.id}`,
            label: (
              <span className={styles.customTopicLabel}>
                {group.name}
                <button
                  type="button"
                  className={styles.customTopicEditButton}
                  aria-label={`编辑群组 ${group.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    openEditGroup(group)
                  }}
                >
                  <span className={styles.customTopicCount}>{getMatchedAccounts(group).length}</span>
                  <EditOutlined className={styles.customTopicEditIcon} />
                </button>
              </span>
            ),
            children: (
              <CustomGroupDetail
                group={group}
                onEdit={() => openEditGroup(group)}
                onViewAccounts={() => setAccountsGroup(group)}
              />
            ),
          })),
        ]}
      />
      {boardMode === 'circle' && topics.length === 0 && customGroups.groups.length === 0 ? (
        <Empty description="暂无监控群组，请创建第一个自定义群组" />
      ) : null}
      {boardMode !== 'circle' ? (
        <TopicDetail
          name={boardMode === 'all' ? '全部' : boardMode === 'global' ? '全部主题' : '热度飙升'}
          topics={topics}
          embedded
          boardMode={boardMode}
          modeOnly
          timeRangeHours={timeRangeHours}
        />
      ) : null}
      <CustomGroupEditorDrawer
        open={editorOpen}
        group={editingGroup}
        onClose={() => {
          setEditorOpen(false)
          setEditingGroup(null)
        }}
        onSave={saveCustomGroup}
      />
      <CustomGroupManagerDrawer
        open={managerOpen}
        groups={customGroups.groups}
        onClose={() => setManagerOpen(false)}
        onEdit={openEditGroup}
        onToggle={(id) => {
          customGroups.toggleGroup(id)
          toast('监控状态已更新')
        }}
        onDelete={deleteCustomGroup}
      />
      <CustomGroupAccountsDrawer group={accountsGroup} onClose={() => setAccountsGroup(null)} />
    </>
  )
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function estimateRecentPosts(recentPostCount3h: number, timeRangeHours: number) {
  return Math.max(0, Math.round(recentPostCount3h * (timeRangeHours / 3)))
}

function TopicDetail({
  name,
  topics = [],
  embedded = false,
  summary,
  boardMode = 'circle',
  modeOnly = false,
  timeRangeHours = 3,
}: {
  name: string
  topics?: TopicCircleMonitorTopic[]
  embedded?: boolean
  summary?: TopicCircleMonitorTopic
  boardMode?: BoardMode
  modeOnly?: boolean
  timeRangeHours?: number
}) {
  const { set } = useApp()
  const [posts, setPosts] = useState<TopicCirclePostLeaderboardItem[]>([])
  const [calculatedAt, setCalculatedAt] = useState<string | null>(null)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountType[]>([])
  const activeMode = BOARD_MODES.find((mode) => mode.key === boardMode) ?? BOARD_MODES[0]
  const totalAccounts = modeOnly
    ? topics.reduce((total, topic) => total + topic.accountCount, 0)
    : summary?.accountCount ?? 0

  const boardPosts = useMemo(() => {
    if (boardMode === 'rising') {
      return [...posts]
        .sort((left, right) => {
          const delta = (right.deltaViews ?? 0) - (left.deltaViews ?? 0)
          if (delta !== 0) return delta
          return (right.metrics?.views ?? 0) - (left.metrics?.views ?? 0)
        })
        .slice(0, 10)
        .map((post, index) => ({ ...post, rank: index + 1 }))
    }

    return posts.slice(0, 10).map((post, index) => ({ ...post, rank: index + 1 }))
  }, [boardMode, posts])

  const visibleBoardPosts = useMemo(() => (
    boardPosts.filter((post) => (
      !accountTypeFilter.length || accountTypeFilter.includes(inferAccountType(post.authorHandle))
    ))
  ), [accountTypeFilter, boardPosts])
  const hotCandidates = visibleBoardPosts.filter((post) => post.status === 'hot_event_candidate').length

  const loadLeaderboard = () => {
    const targetTopics = boardMode === 'circle' && !modeOnly
      ? [name]
      : topics.length
        ? topics.map((topic) => topic.name)
        : [name]

    const mergedPosts = dedupeLeaderboardPosts(
      MOCK_LEADERBOARD_POSTS.filter((post) => targetTopics.includes(post.topicWatchName)),
    )
    const sortedPosts = mergedPosts.sort((left, right) => {
      if (boardMode === 'rising') {
        const delta = (right.deltaViews ?? 0) - (left.deltaViews ?? 0)
        if (delta !== 0) return delta
      }
      return (right.metrics?.views ?? 0) - (left.metrics?.views ?? 0)
    })
    setPosts(sortedPosts)
    setCalculatedAt(MOCK_CALCULATED_AT)
    setExpandedPostId(null)
  }

  useEffect(() => {
    loadLeaderboard()
  }, [name, boardMode, topics.length, modeOnly])

  return (
    <>
      {!embedded ? (
        <div className={styles.topicDetailBreadcrumb}>
          <Button type="link" onClick={() => set({ topicDetail: null })}>
            重点主题追踪
          </Button>
          <span className="muted">/</span>
          <b>{name}</b>
        </div>
      ) : null}
      <section className={styles.topicDetailSummary}>
        <div>
          <span className="small">{modeOnly ? '当前榜单' : '当前主题'}</span>
          <h1>{modeOnly ? activeMode.label : `${name}帖子榜`}</h1>
          <span className="small">
            {modeOnly
              ? `${topics.length} 个主题圈 · ${totalAccounts} 个监控账号`
              : summary
              ? `${summary.enabled ? '启用' : '停用'} · ${summary.accountCount} 个监控账号 · 近 ${timeRangeHours} 小时 ${estimateRecentPosts(summary.recentPostCount3h, timeRangeHours)} 条帖子`
              : '按监控账号帖子表现生成圈内榜单'}
          </span>
        </div>
        <div>
          <span className="small">{boardMode === 'circle' ? '圈内上榜' : '进入当前榜单'}</span>
          <strong>{visibleBoardPosts.length}</strong>
          <span className="small">条帖子</span>
        </div>
        <div>
          <span className="small">Hot Event 候选</span>
          <strong>{hotCandidates}</strong>
          <span className="small">待事件判断</span>
        </div>
        <div>
          <span className="small">榜单计算时间</span>
          <strong>{calculatedAt ? formatTime(calculatedAt) : '—'}</strong>
        </div>
        <div>
          <span className="small">监控账号</span>
          <strong>{totalAccounts}</strong>
          <span className="small">个</span>
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>{modeOnly ? activeMode.label : `${name} · ${activeMode.label}`}</h2>
            <p className="small">{activeMode.desc} · 最近更新 {calculatedAt ? formatTime(calculatedAt) : '—'}</p>
          </div>
        </div>
        <div className={styles.topicTrendHead}>
          <span>排名</span>
          <span>热门内容</span>
          <SourceAccountFilter value={accountTypeFilter} onChange={setAccountTypeFilter} />
          <span>当前浏览量</span>
          <span>本轮新增</span>
          <span>榜单变化</span>
          <span>状态</span>
        </div>
        {visibleBoardPosts.length === 0 ? (
          <Empty
            description={boardPosts.length ? '当前账号类型没有匹配帖子' : '暂无帖子榜单，等待采集'}
          >
            {boardPosts.length ? (
              <Button onClick={() => setAccountTypeFilter([])}>清除账号类型筛选</Button>
            ) : null}
          </Empty>
        ) : (
          <div className={styles.topicLeaderboard}>
            {visibleBoardPosts.map((post) => {
              const expanded = expandedPostId === post.signalId
              return (
                <article key={post.signalId} className={styles.topicRankItem}>
                  <button
                    type="button"
                    className={styles.topicTrendRow}
                    onClick={() => setExpandedPostId(expanded ? null : post.signalId)}
                  >
                    <RankBadge rank={post.rank} />
                    <TopicTrendLabel post={post} />
                  </button>
                  {expanded ? <TopicPostPanel post={post} /> : null}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

function TopicTrendLabel({ post }: { post: TopicCirclePostLeaderboardItem }) {
  return (
    <>
      <span className={styles.topicContentCell}>
        <b>{summarizePost(post)}</b>
        <small className="muted">{post.topicWatchName} · 发布 {formatTime(post.publishedAt)}</small>
      </span>
      <span className={styles.topicAuthor}>
        <i>{getAuthorInitial(post.authorHandle)}</i>
        @{post.authorHandle.replace(/^@/, '')}
      </span>
      <strong>{formatMetric(post.metrics?.views)}</strong>
      <span className={post.deltaViews ? styles.topicPositive : ''}>
        {post.deltaViews == null ? '—' : `+${formatMetric(post.deltaViews)}`}
      </span>
      <span>{formatRankChange(post.previousRank, post.rank)}</span>
      <Tag color={post.status === 'hot_event_candidate' ? 'orange' : 'processing'}>
        {post.status === 'hot_event_candidate' ? '热点事件候选' : '观察中'}
      </Tag>
    </>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const tone = rank <= 3 ? styles.topicRankHot : ''
  return <span className={`${styles.topicRankBadge} ${tone}`}>{rank}</span>
}

function TopicPostPanel({ post }: { post: TopicCirclePostLeaderboardItem }) {
  return (
    <div className={styles.topicPostPanel}>
      <div className={styles.topicPostSummary}>
        <span>来源账号：@{post.authorHandle.replace(/^@/, '')}</span>
        <span>首次观测：{formatTime(post.firstObservedAt)}</span>
        <span>最近观测：{formatTime(post.lastObservedAt)}</span>
      </div>
      <div className={styles.topicPostList}>
        <TopicPostItem post={post} />
      </div>
      <ViralFormula post={post} />
    </div>
  )
}

function ViralFormula({ post }: { post: TopicCirclePostLeaderboardItem }) {
  const factors = buildViralFormula(post)
  return (
    <section className={styles.viralFormula}>
      <div className={styles.viralFormulaHead}>
        <span><BulbOutlined /> 爆款公式</span>
        <Tag color="blue">规则提炼</Tag>
      </div>
      <strong>{factors.join(' × ')}</strong>
      <p>提炼依据：曝光规模、互动密度、增长速度、内容表达和事件候选状态。</p>
    </section>
  )
}

function buildViralFormula(post: TopicCirclePostLeaderboardItem) {
  const views = post.metrics?.views ?? 0
  const likes = post.metrics?.likes ?? 0
  const replies = post.metrics?.replies ?? 0
  const likeRate = views > 0 ? likes / views : 0
  return [
    views >= 500_000 ? '强曝光基数' : '垂直流量切口',
    likeRate >= 0.02 ? '高点赞密度' : '核心结论前置',
    replies >= 100 ? '可讨论议题' : '低门槛理解',
    (post.deltaViews ?? 0) > 0 ? '增长窗口' : '稳定热度',
    post.status === 'hot_event_candidate' ? '事件化表达' : '持续观察价值',
  ]
}

function TopicPostItem({ post }: { post: TopicCircleTopicPost }) {
  return (
    <article className={styles.topicPostItem}>
      <div className={styles.topicPostMeta}>
        <strong>{post.authorName || post.authorHandle}</strong>
        <span>@{post.authorHandle.replace(/^@/, '')}</span>
        <span>{formatTime(post.publishedAt)}</span>
      </div>
      <p>{post.text || '暂无正文'}</p>
      <div className={styles.topicPostFooter}>
        <span>浏览 {formatMetric(post.metrics?.views)}</span>
        <span>点赞 {formatMetric(post.metrics?.likes)}</span>
        <span>回复 {formatMetric(post.metrics?.replies)}</span>
        <span>转发 {formatMetric(post.metrics?.reposts)}</span>
        {post.url ? (
          <Button size="small" href={post.url} target="_blank" rel="noreferrer">
            打开帖子
          </Button>
        ) : null}
      </div>
    </article>
  )
}

function formatMetric(value?: number) {
  if (value == null) return '—'
  return new Intl.NumberFormat('zh-CN', { notation: 'compact' }).format(value)
}

function formatRankChange(previousRank: number | null, rank: number) {
  if (previousRank == null) return '—'
  const delta = previousRank - rank
  if (delta > 0) return `↑ ${delta}`
  if (delta < 0) return `↓ ${Math.abs(delta)}`
  return '—'
}

function getAuthorInitial(handle: string) {
  return handle.replace(/^@/, '').slice(0, 1).toUpperCase() || 'X'
}

function summarizePost(post: TopicCirclePostLeaderboardItem) {
  const text = post.text.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim()
  if (!text) return '暂无正文摘要'
  if (/[\u4e00-\u9fa5]/.test(text)) return truncateText(text, 42)
  return truncateText(`${post.authorHandle.replace(/^@/, '')} 发布了一条与${post.topicWatchName}相关的帖子：${text}`, 58)
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value
}

function createMockPost({
  rank,
  signalId,
  topicWatchId,
  topicWatchName,
  authorHandle,
  authorName,
  text,
  views,
  likes,
  replies,
  reposts,
  deltaViews,
  previousRank,
  status,
  publishedAt,
}: {
  rank: number
  signalId: string
  topicWatchId: string
  topicWatchName: string
  authorHandle: string
  authorName: string
  text: string
  views: number
  likes: number
  replies: number
  reposts: number
  deltaViews: number
  previousRank: number | null
  status: TopicCirclePostLeaderboardItem['status']
  publishedAt: string
}): TopicCirclePostLeaderboardItem {
  return {
    rank,
    signalId,
    topicWatchId,
    topicWatchName,
    postId: signalId.replace('mock-', 'post-'),
    authorHandle,
    authorName,
    text,
    url: `https://x.com/${authorHandle.replace(/^@/, '')}/status/${signalId}`,
    postType: 'post',
    publishedAt,
    metrics: {
      views,
      likes,
      replies,
      reposts,
      quotes: Math.round(reposts * 0.18),
    },
    firstObservedAt: '2026-09-04T09:30:00+08:00',
    lastObservedAt: MOCK_CALCULATED_AT,
    deltaViews,
    previousRank,
    status,
  }
}

function dedupeLeaderboardPosts(posts: TopicCirclePostLeaderboardItem[]) {
  const map = new Map<string, TopicCirclePostLeaderboardItem>()
  posts.forEach((post) => {
    const key = post.postId || post.url || post.signalId
    const existing = map.get(key)
    if (!existing || new Date(post.lastObservedAt).getTime() > new Date(existing.lastObservedAt).getTime()) {
      map.set(key, post)
    }
  })
  return Array.from(map.values())
}
