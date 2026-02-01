import { useMemo, useState, useEffect, useRef } from 'react'

export interface TreemapNode {
  name: string
  path: string
  size: number
  is_dir?: boolean
  children?: TreemapNode[]
}

interface Block {
  x: number
  y: number
  w: number
  h: number
  node: TreemapNode
  depth: number
}

const MIN_BLOCK_SIZE = 16
const MAX_DEPTH = 6

/** 单层 squarified 布局：将矩形 (x,y,w,h) 按 nodes 的 size 比例划分 */
function squarifyRow(
  nodes: TreemapNode[],
  x: number,
  y: number,
  w: number,
  h: number,
  horizontal: boolean
): { node: TreemapNode; x: number; y: number; w: number; h: number }[] {
  const total = nodes.reduce((s, n) => s + n.size, 0)
  if (total <= 0 || nodes.length === 0) return []

  const sorted = [...nodes].filter((n) => n.size > 0).sort((a, b) => b.size - a.size)
  const result: { node: TreemapNode; x: number; y: number; w: number; h: number }[] = []
  let px = x,
    py = y,
    pw = w,
    ph = h
  let remainingTotal = total

  for (let i = 0; i < sorted.length; ) {
    const main = horizontal ? pw : ph
    const sub = horizontal ? ph : pw
    let row: TreemapNode[] = [sorted[i]]
    let rowSum = sorted[i].size
    i++

    while (i < sorted.length) {
      const next = sorted[i]
      const newSum = rowSum + next.size
      const newRow = [...row, next]
      const r1 = main * (rowSum / remainingTotal)
      const r2 = main * (newSum / remainingTotal)
      const worst1 = Math.max(sub / r1, r1 / sub)
      const worst2 = Math.max(sub / r2, r2 / sub)
      if (worst1 <= worst2) {
        row = newRow
        rowSum = newSum
        i++
      } else break
    }

    const rowRatio = rowSum / remainingTotal
    let rw: number, rh: number, rx: number, ry: number
    if (horizontal) {
      rw = pw * rowRatio
      rh = ph
      rx = px
      ry = py
      px += rw
      pw -= rw
    } else {
      rw = pw
      rh = ph * rowRatio
      rx = px
      ry = py
      py += rh
      ph -= rh
    }

    let ix = rx,
      iy = ry
    row.forEach((node) => {
      const frac = node.size / rowSum
      const iw = horizontal ? rw * frac : rw
      const ih = horizontal ? rh : rh * frac
      result.push({ node, x: ix, y: iy, w: iw, h: ih })
      if (horizontal) ix += iw
      else iy += ih
    })

    remainingTotal -= rowSum
  }

  return result
}

/** 递归堆叠布局：生成所有层级的方块（父先子后，子绘制在上层） */
function layoutRecursive(
  root: TreemapNode,
  x: number,
  y: number,
  w: number,
  h: number,
  depth: number,
  output: Block[]
) {
  const children = (root.children ?? []).filter((c) => c.size > 0)
  const horizontal = w >= h

  if (children.length === 0 || depth >= MAX_DEPTH || w < MIN_BLOCK_SIZE || h < MIN_BLOCK_SIZE) {
    output.push({ x, y, w, h, node: root, depth })
    return
  }

  const rows = squarifyRow(children, x, y, w, h, horizontal)

  for (const { node, x: cx, y: cy, w: cw, h: ch } of rows) {
    const subChildren = (node.children ?? []).filter((c) => c.size > 0)
    const canRecurse =
      subChildren.length > 0 &&
      cw >= MIN_BLOCK_SIZE &&
      ch >= MIN_BLOCK_SIZE &&
      depth + 1 < MAX_DEPTH

    if (canRecurse) {
      layoutRecursive(node, cx, cy, cw, ch, depth + 1, output)
    } else {
      output.push({ x: cx, y: cy, w: cw, h: ch, node, depth: depth + 1 })
    }
  }
}

interface TreemapProps {
  root: TreemapNode
  width: number
  height: number
  onHover?: (node: TreemapNode | null) => void
}

export function Treemap({ root, width, height, onHover }: TreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width, height })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0]?.contentRect ?? { width, height }
      setDimensions({ width: Math.max(1, w), height: Math.max(1, h) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const blocks = useMemo(() => {
    const out: Block[] = []
    layoutRecursive(root, 2, 2, dimensions.width - 4, dimensions.height - 4, 0, out)
    return out
  }, [root, dimensions])

  const colorsByDepth = [
    'rgba(255, 210, 0, 0.7)',
    'rgba(26, 26, 26, 0.6)',
    'rgba(255, 210, 0, 0.5)',
    'rgba(26, 26, 26, 0.5)',
    'rgba(178, 230, 0, 0.55)',
    'rgba(255, 210, 0, 0.4)',
  ]

  return (
    <div ref={containerRef} className="w-full h-full min-h-[350px]">
      <svg width={dimensions.width} height={dimensions.height} className="block">
        {blocks.map((block, i) => {
          const color = colorsByDepth[block.depth % colorsByDepth.length]
          const showLabel = block.w > 40 && block.h > 22
          return (
            <g key={`${block.node.path}-${i}`}>
              <rect
                x={block.x}
                y={block.y}
                width={block.w}
                height={block.h}
                fill={color}
                stroke="rgba(0,0,0,0.12)"
                strokeWidth={1}
                onMouseEnter={() => onHover?.(block.node)}
                onMouseLeave={() => onHover?.(null)}
                className="cursor-pointer transition-opacity hover:opacity-90"
              />
              {showLabel && (
                <text
                  x={block.x + block.w / 2}
                  y={block.y + block.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#1a1a1a"
                  className="pointer-events-none select-none font-medium"
                  style={{ fontSize: Math.min(10, block.w / 5, block.h / 2.5) }}
                >
                  {block.node.name.length > 12
                    ? block.node.name.slice(0, 10) + '…'
                    : block.node.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
