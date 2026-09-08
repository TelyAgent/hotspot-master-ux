import { useEffect, useState } from 'react'
import { Button, Select, Tabs, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import { Head } from '../../components/ui'
import { useTrending } from '../../hooks/useTrending'
import { useTrendRegions } from '../../hooks/useTrendRegions'
import Ranking from './Ranking'
import Topics from './Topics'
import styles from './Monitor.module.css'

const SUBTABS = [
  ['ranking', '热搜排行榜'],
  ['topics', '重点主题追踪'],
] as const

const TIME_RANGE_OPTIONS = [1, 3, 6, 12, 24].map((hours) => ({
  value: hours,
  label: `近 ${hours} 小时`,
}))

function formatCollectionTime(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}`
}

export default function Monitor() {
  const { mt, set, region, toast } = useApp()
  const trendRegions = useTrendRegions()
  const { data, loading, error } = useTrending(region)
  const [timeRangeHours, setTimeRangeHours] = useState(3)
  const [collecting, setCollecting] = useState(false)
  const [latestCollection, setLatestCollection] = useState('最近一次：succeeded · 0 条 · 09/04 09:30')

  useEffect(() => {
    if (!trendRegions.loading && trendRegions.regions.length > 0 && !trendRegions.regions.includes(region)) {
      set({ region: trendRegions.regions[0] })
    }
  }, [region, set, trendRegions.loading, trendRegions.regions])

  const collectCurrentView = async () => {
    setCollecting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    setCollecting(false)
    setLatestCollection(`最近一次：succeeded · 10 条 · ${formatCollectionTime(new Date())}`)
    toast(`已完成近 ${timeRangeHours} 小时数据的模拟采集`)
  }

  return (
    <>
      <Head
        title="热点监测"
        desc="完整呈现和聚合各地区排行榜；是否进入响应由事件库承接。"
      />
      <Tabs
        className={styles.subtabs}
        activeKey={mt}
        items={SUBTABS.map(([key, label]) => ({ key, label }))}
        onChange={(key) => set({ mt: key })}
        tabBarExtraContent={(
          <div className={styles.monitorTabsExtra}>
            <span>时间范围</span>
            <Select
              aria-label="时间范围"
              value={timeRangeHours}
              options={TIME_RANGE_OPTIONS}
              popupMatchSelectWidth={false}
              onChange={(value) => {
                setTimeRangeHours(value)
                toast(`已切换至近 ${value} 小时`)
              }}
            />
            <Tooltip title={latestCollection} placement="bottomRight">
              <Button
                className={styles.softCollectButton}
                icon={<ReloadOutlined />}
                loading={collecting}
                onClick={() => void collectCurrentView()}
              >
                {collecting ? '采集中…' : '立即采集'}
              </Button>
            </Tooltip>
          </div>
        )}
      />
      {mt === 'ranking' ? (
        <Ranking
          data={data}
          loading={loading || trendRegions.loading}
          error={error ?? trendRegions.error}
          regions={trendRegions.regions}
          timeRangeHours={timeRangeHours}
        />
      ) : mt === 'topics' ? (
        <Topics timeRangeHours={timeRangeHours} />
      ) : (
        <Ranking
          data={data}
          loading={loading || trendRegions.loading}
          error={error ?? trendRegions.error}
          regions={trendRegions.regions}
          timeRangeHours={timeRangeHours}
        />
      )}
    </>
  )
}
