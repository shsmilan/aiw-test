import { useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import bodyPuppetImage from './assets/VA11A+ (Future concept with image viewer)/puppet/body.svg'
import lungsImage from './assets/lungs.svg'
import lung01Image from './assets/images/lung01.png'
import aircScImage from './assets/images/airc_sc.jpg'
import './App.css'

const STARTING_WIDTHS = [24, 48, 28]
const MIN_SECTION_WIDTHS = [220, 340, 260]
const DEDICATED_MIN_SECTION_WIDTHS = [160, 340, 260]
const MOBILE_BREAKPOINT = 980
const VIEWER_MIN_SCALE = 1.08
const VIEWER_MAX_SCALE = 2.5
const VIEWER_ZOOM_STEP = 0.0015

type Divider = 0 | 1

type DragState = {
  divider: Divider
  startX: number
  startWidths: number[]
  containerWidth: number
}

type ViewerTransform = {
  scale: number
  panX: number
  panY: number
}

type ViewerPanState = {
  pointerId: number
  startX: number
  startY: number
  startPanX: number
  startPanY: number
}

type ReviewFindingStatus = 'accepted' | 'rejected'
type DedicatedLeftTab = 'overview' | 'images' | 'results'

type FindingInfoModalState = {
  findingName: string
}

type ImageFinding = {
  id: string
  label: string
  description: string
  top: string
  left: string
}

type BadgeTone = 'critical' | 'warning' | 'info'

type TreeBadge = {
  value: number
  tone: BadgeTone
}

type StudyTreeNode = {
  id: string
  label: string
  metricValue?: string
  count?: number
  badges?: TreeBadge[]
  findingId?: string
  thumbnailId?: string
  children?: StudyTreeNode[]
}

type Finding = {
  id: string
  title: string
  summary: string
  metric: string
  nodeId: string
}

type Thumbnail = {
  id: string
  findingId: string
  label: string
  variant: 'brain' | 'cervical' | 'midline' | 'skull'
}

type StudyOption = {
  id: string
  label: string
  group: 'Current' | 'Prior'
}

type ThumbnailGroup = {
  id: string
  title: string
  findingIds: string[]
}

const FINDINGS: Finding[] = [
  {
    id: 'brain-hemorrhage',
    title: 'Brain hemorrhage',
    summary: 'Right sided intracranial subarachnoid hemorrhage with subdural hematoma.',
    metric: 'Volume: 43.55 ml',
    nodeId: 'hn-brain-hem',
  },
  {
    id: 'cervical-spine-fracture',
    title: 'Cervical spine fracture',
    summary: 'Comminuted fracture pattern with associated soft tissue swelling.',
    metric: 'IMG_01',
    nodeId: 'hn-cervical-fracture',
  },
  {
    id: 'midline-shift',
    title: 'Midline shift',
    summary: 'Right-to-left midline shift measuring approximately 1.02 mm.',
    metric: '1.02 mm',
    nodeId: 'hn-midline-shift',
  },
  {
    id: 'skull-fracture',
    title: 'Skull unfolding (fracture)',
    summary: 'Linear and branching fracture lines involving right parietal bone.',
    metric: 'IMG_02',
    nodeId: 'hn-skull-fracture',
  },
  {
    id: 'pelvic-free-fluid',
    title: 'Pelvic free fluid',
    summary: 'Dependent fluid collection in the pelvic cavity, suspicious for traumatic injury.',
    metric: 'IMG_03',
    nodeId: 'ab-pelvic-fluid',
  },
  {
    id: 'possible-tibia-fracture',
    title: 'Possible tibia fracture',
    summary: 'Subtle cortical irregularity at the proximal tibia, correlation recommended.',
    metric: 'IMG_04',
    nodeId: 'le-tibia',
  },
]

const THUMBNAILS: Thumbnail[] = [
  { id: 'thumb-1', findingId: 'brain-hemorrhage', label: '1 • Brain hemorrhage', variant: 'brain' },
  { id: 'thumb-2', findingId: 'brain-hemorrhage', label: '1 • Brain hemorrhage', variant: 'brain' },
  {
    id: 'thumb-3',
    findingId: 'cervical-spine-fracture',
    label: '1 • Cervical spine fracture',
    variant: 'cervical',
  },
  { id: 'thumb-4', findingId: 'midline-shift', label: '1 • Midline shift', variant: 'midline' },
  { id: 'thumb-5', findingId: 'skull-fracture', label: '1 • Skull unfolding', variant: 'skull' },
  { id: 'thumb-6', findingId: 'skull-fracture', label: '1 • Skull unfolding', variant: 'skull' },
  { id: 'thumb-7', findingId: 'midline-shift', label: '1 • Midline shift', variant: 'midline' },
  { id: 'thumb-8', findingId: 'brain-hemorrhage', label: '1 • Brain hemorrhage', variant: 'brain' },
  { id: 'thumb-9', findingId: 'cervical-spine-fracture', label: '1 • Cervical spine fracture', variant: 'cervical' },
  { id: 'thumb-10', findingId: 'midline-shift', label: '1 • Midline shift', variant: 'midline' },
  { id: 'thumb-11', findingId: 'skull-fracture', label: '1 • Skull unfolding', variant: 'skull' },
  { id: 'thumb-12', findingId: 'brain-hemorrhage', label: '1 • Brain hemorrhage', variant: 'brain' },
  { id: 'thumb-13', findingId: 'pelvic-free-fluid', label: '1 • Pelvic free fluid', variant: 'midline' },
  {
    id: 'thumb-14',
    findingId: 'possible-tibia-fracture',
    label: '1 • Possible tibia fracture',
    variant: 'cervical',
  },
]

const STUDY_OPTIONS: StudyOption[] = [
  { id: 'ct-2026', label: 'CT, 2026/12/31 23:59:59', group: 'Current' },
  { id: 'ct-2025', label: 'CT, 2025/12/31 23:59:59', group: 'Current' },
  { id: 'ct-2024', label: 'CT, 2024/12/31 23:59:59', group: 'Current' },
  { id: 'ct-2023', label: 'CT, 2023/12/31 23:59:59', group: 'Prior' },
  { id: 'ct-2022', label: 'CT, 2022/12/31 23:59:59', group: 'Prior' },
]

const STUDY_TREE: StudyTreeNode[] = [
  {
    id: 'ct-main',
    label: 'CT [2026/12/31], 09:14',
    count: 2,
    children: [
      {
        id: 'head-neck',
        label: 'Head and Neck',
        badges: [
          { value: 2, tone: 'critical' },
          { value: 1, tone: 'warning' },
          { value: 1, tone: 'info' },
        ],
        children: [
          {
            id: 'hn-brain-hem',
            label: 'Brain hemorrhage',
            metricValue: '43.55 ml',
            findingId: 'brain-hemorrhage',
            thumbnailId: 'thumb-1',
          },
          {
            id: 'hn-cervical-fracture',
            label: 'Cervical spine fracture',
            metricValue: 'IMG_01',
            findingId: 'cervical-spine-fracture',
            thumbnailId: 'thumb-3',
          },
          {
            id: 'hn-midline-shift',
            label: 'Midline shift',
            metricValue: '1.02 mm',
            findingId: 'midline-shift',
            thumbnailId: 'thumb-4',
          },
          {
            id: 'hn-skull-fracture',
            label: 'Skull unfolding (fracture)',
            metricValue: 'IMG_02',
            findingId: 'skull-fracture',
            thumbnailId: 'thumb-5',
          },
        ],
      },
      {
        id: 'abdomen',
        label: 'Abdomen',
        badges: [{ value: 1, tone: 'info' }],
        children: [
          {
            id: 'ab-pelvic-fluid',
            label: 'Pelvic free fluid',
            count: 1,
            metricValue: 'IMG_03',
            findingId: 'pelvic-free-fluid',
            thumbnailId: 'thumb-13',
          },
        ],
      },
      {
        id: 'lower-ext',
        label: 'Lower Extremities',
        badges: [{ value: 1, tone: 'warning' }],
        children: [
          {
            id: 'le-tibia',
            label: 'Possible tibia fracture',
            count: 1,
            metricValue: 'IMG_04',
            findingId: 'possible-tibia-fracture',
            thumbnailId: 'thumb-14',
          },
        ],
      },
    ],
  },
]

const THUMBNAIL_GROUPS: ThumbnailGroup[] = [
  {
    id: 'head-neck',
    title: 'Head & neck',
    findingIds: ['brain-hemorrhage', 'midline-shift'],
  },
  {
    id: 'abdomen',
    title: 'Abdomen',
    findingIds: ['pelvic-free-fluid'],
  },
  {
    id: 'lower-extremities',
    title: 'Lower Extremities',
    findingIds: ['possible-tibia-fracture'],
  },
]

const IMAGE_FINDING_COUNTS: Record<string, number> = {
  'thumb-1': 6,
  'thumb-2': 4,
  'thumb-3': 5,
  'thumb-4': 6,
  'thumb-5': 3,
  'thumb-6': 5,
  'thumb-7': 4,
  'thumb-8': 7,
  'thumb-9': 2,
  'thumb-10': 6,
  'thumb-11': 3,
  'thumb-12': 5,
  'thumb-13': 4,
  'thumb-14': 3,
}

const hashString = (value: string): number => {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

const seededUnit = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const toPercent = (value: number): string => `${value.toFixed(1)}%`

const createImageFindings = (thumbnailId: string, count: number): ImageFinding[] =>
  Array.from({ length: count }, (_, index) => {
    const baseSeed = hashString(`${thumbnailId}:${index}`)
    const top = 18 + seededUnit(baseSeed + 7) * 64
    const left = 18 + seededUnit(baseSeed + 19) * 64

    return {
      id: `${thumbnailId}-finding-${index + 1}`,
      label: `[L${index + 1}] Finding`,
      description: 'Description',
      top: toPercent(top),
      left: toPercent(left),
    }
  })

const LAYOUT_PRESETS = [
  'Polytrauma',
  'Lung Screening',
  'Cardiac evaluations',
  'Stroke',
  'Staging scans',
  'Saved custom layout name',
]

type LayoutPreset = (typeof LAYOUT_PRESETS)[number]

const DEDICATED_LAYOUT_OPTIONS = ['2x1 Stack', '3x3 Stack', '1x1 Stack'] as const

type DedicatedLayoutOption = (typeof DEDICATED_LAYOUT_OPTIONS)[number]

const STATE_OPTIONS = [
  { id: 'opened', label: 'Opened', disabled: false },
  { id: 'resolved', label: 'Resolved / visited', disabled: false },
  { id: 'rejected', label: 'Rejected', disabled: true },
]

const PROFILE_MENU_ITEMS = [
  'Settings',
  'About Software',
  'Privacy Notice',
  'Open Source Licenses',
  'Help',
  'Log out',
]

type OverviewGroupingMode = 'body-regions' | 'priority' | 'source'

const OVERVIEW_GROUPING_OPTIONS: Array<{ id: OverviewGroupingMode; label: string }> = [
  { id: 'body-regions', label: 'Body regions' },
  { id: 'priority', label: 'Priority' },
  { id: 'source', label: 'Source' },
]

type NotificationFilter = {
  id: string
  label: string
}

type NotificationItem = {
  id: string
  patientName: string
  demographics: string
  accession: string
  finding: string
  findingTone?: 'default' | 'empty'
  extraFindingLine?: string
}

const NOTIFICATION_FILTERS: NotificationFilter[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread only' },
  { id: 'callups', label: 'All call-ups' },
  { id: 'p1', label: 'P1' },
  { id: 'p2', label: 'P2' },
  { id: 'p3', label: 'P3' },
]

const NOTIFICATION_ITEMS: NotificationItem[] = [
  {
    id: 'notif-ron-swanson',
    patientName: 'Ron Swanson',
    demographics: '1966/12/31  M  71Y',
    accession: 'Xk9Lp...Q2zM7tVa',
    finding: '*Poly Trauma [fa...',
  },
  {
    id: 'notif-april-ludgate',
    patientName: 'April Ludgate',
    demographics: '03/28/1989  F  37',
    accession: 'LVHJEJJvw4qt2qk5',
    finding: 'Thorax, Lung Nodules',
  },
  {
    id: 'notif-ben-wyatt',
    patientName: 'Ben Wyatt',
    demographics: '11/14/1974  M  51',
    accession: 'lcQRlanIw8trzlAy',
    finding: 'No results',
    findingTone: 'empty',
    extraFindingLine: '-',
  },
  {
    id: 'notif-tammy-swanson-ii',
    patientName: 'Tammy Swanson II',
    demographics: '06/15/1969  F  57',
    accession: 'HHk9a...Q23m8rJo',
    finding: '*Poly Trauma',
  },
  {
    id: 'notif-leslie-knope',
    patientName: 'Leslie Knope',
    demographics: '01/18/1975  F  50',
    accession: 'R4mH2p...Ls10Yx',
    finding: 'Head and Neck follow-up',
  },
  {
    id: 'notif-chris-traeger',
    patientName: 'Chris Traeger',
    demographics: '08/22/1971  M  54',
    accession: 'T8eQ9a...Cd38Mp',
    finding: 'No results',
    findingTone: 'empty',
    extraFindingLine: '-',
  },
  {
    id: 'notif-ann-perkins',
    patientName: 'Ann Perkins',
    demographics: '04/08/1983  F  43',
    accession: 'B2nV7j...Ga59Wu',
    finding: 'Lung nodules review',
  },
  {
    id: 'notif-tom-haverford',
    patientName: 'Tom Haverford',
    demographics: '11/29/1982  M  44',
    accession: 'P6sX1r...Um73Kz',
    finding: '*Poly Trauma [fa...',
  },
]

type WorklistMarkerTone = 'critical' | 'warning' | 'info'

type WorklistMarker = {
  value: number
  tone: WorklistMarkerTone
}

type WorklistState = 'opened' | 'visited' | 'new' | 'processing'

type WorklistRow = {
  id: string
  patientName: string
  dob: string
  sex: string
  age: number
  pid: string
  resultsPreview: string
  protocol: string
  markers: WorklistMarker[]
  state: WorklistState
}

const WORKLIST_TABS = ['Newest', 'By urgency', 'Custom1', 'Custom2']

type CaseTabId = 'case-1' | 'case-2'

type CaseTab = {
  id: CaseTabId
  name: string
  meta: string
}

type CaseWorkspaceData = {
  findings: Finding[]
  thumbnails: Thumbnail[]
  studyTree: StudyTreeNode[]
  thumbnailGroups: ThumbnailGroup[]
  imageFindingCounts: Record<string, number>
  anatomyVisualization: 'body' | 'lungs'
  puppetBadgeDots: Array<{
    findingId: string
    region: string
    top: string
    left: string
  }>
  defaultFindingId: string
  defaultThumbnailId: string
  defaultLayoutPreset: LayoutPreset
}

const CASE_TABS: CaseTab[] = [
  { id: 'case-1', name: 'Ron Swanson', meta: '1966/12/31 M 71Y' },
  { id: 'case-2', name: 'April Ludgate', meta: '03/28/1989 F 37Y' },
]

const CASE_WORKSPACE_DATA: Record<CaseTabId, CaseWorkspaceData> = {
  'case-1': {
    findings: FINDINGS,
    thumbnails: THUMBNAILS,
    studyTree: STUDY_TREE,
    thumbnailGroups: THUMBNAIL_GROUPS,
    imageFindingCounts: IMAGE_FINDING_COUNTS,
    anatomyVisualization: 'body',
    puppetBadgeDots: [
      { findingId: 'brain-hemorrhage', region: 'head-neck', top: 'calc(12% - 64px)', left: 'calc(50% - 22px)' },
      { findingId: 'midline-shift', region: 'head-neck', top: 'calc(12% - 64px)', left: 'calc(50% - 6px)' },
      { findingId: 'skull-fracture', region: 'head-neck', top: 'calc(12% - 64px)', left: 'calc(50% + 10px)' },
      { findingId: 'cervical-spine-fracture', region: 'head-neck', top: 'calc(22% - 64px)', left: 'calc(50% - 4px)' },
      { findingId: 'pelvic-free-fluid', region: 'abdomen', top: 'calc(57% - 64px)', left: 'calc(54% - 6px)' },
      { findingId: 'possible-tibia-fracture', region: 'lower-ext', top: 'calc(80% - 64px)', left: 'calc(52% - 6px)' },
    ],
    defaultFindingId: 'brain-hemorrhage',
    defaultThumbnailId: 'thumb-1',
    defaultLayoutPreset: 'Polytrauma',
  },
  'case-2': {
    findings: [
      {
        id: 'thorax-lung-nodules',
        title: 'Lung nodules',
        summary: 'Single frontal chest image with a suspicious right upper lobe pulmonary nodule.',
        metric: 'IMG_01',
        nodeId: 'tx-lung-nodules',
      },
      {
        id: 'thorax-pulmonary-density',
        title: 'Pulmonary density',
        summary: 'Focal right lower lobe pulmonary density suspicious for a consolidative opacity.',
        metric: 'IMG_02',
        nodeId: 'tx-pulmonary-density',
      },
    ],
    thumbnails: [
      {
        id: 'thumb-case2-thorax-1',
        findingId: 'thorax-lung-nodules',
        label: '1 • Thorax lung nodules',
        variant: 'midline',
      },
      {
        id: 'thumb-case2-thorax-2',
        findingId: 'thorax-pulmonary-density',
        label: '1 • Pulmonary density',
        variant: 'midline',
      },
      {
        id: 'thumb-case2-thorax-3',
        findingId: 'thorax-lung-nodules',
        label: '2 • Thorax lung nodules',
        variant: 'midline',
      },
      {
        id: 'thumb-case2-thorax-4',
        findingId: 'thorax-lung-nodules',
        label: '3 • Thorax lung nodules',
        variant: 'midline',
      },
    ],
    studyTree: [
      {
        id: 'ct-thorax-main',
        label: 'CT [2026/12/31], 09:14',
        count: 2,
        children: [
          {
            id: 'airc',
            label: 'Chest CT',
            badges: [{ value: 2, tone: 'info' }],
            children: [
              {
                id: 'tx-lung-nodules',
                label: 'Lung nodules',
                count: 1,
                metricValue: 'IMG_01',
                findingId: 'thorax-lung-nodules',
                thumbnailId: 'thumb-case2-thorax-1',
              },
              {
                id: 'tx-pulmonary-density',
                label: 'Pulmonary density',
                count: 1,
                metricValue: 'IMG_02',
                findingId: 'thorax-pulmonary-density',
                thumbnailId: 'thumb-case2-thorax-2',
              },
            ],
          },
        ],
      },
    ],
    thumbnailGroups: [
      {
        id: 'airc-chest-ct-lung-nodules',
        title: 'AIRC - Chest CT / Lung nodules',
        findingIds: ['thorax-lung-nodules'],
      },
      {
        id: 'airc-chest-ct-pulmonary-density',
        title: 'AIRC - Chest CT / Pulmonary density',
        findingIds: ['thorax-pulmonary-density'],
      },
    ],
    imageFindingCounts: {
      'thumb-case2-thorax-1': 1,
      'thumb-case2-thorax-2': 1,
      'thumb-case2-thorax-3': 1,
      'thumb-case2-thorax-4': 1,
    },
    anatomyVisualization: 'lungs',
    puppetBadgeDots: [
      {
        findingId: 'thorax-lung-nodules',
        region: 'thorax',
        top: '30%',
        left: '22%',
      },
      {
        findingId: 'thorax-pulmonary-density',
        region: 'thorax',
        top: '58%',
        left: '78%',
      },
    ],
    defaultFindingId: 'thorax-lung-nodules',
    defaultThumbnailId: 'thumb-case2-thorax-1',
    defaultLayoutPreset: 'Lung Screening',
  },
}

const WORKLIST_ROWS: WorklistRow[] = [
  {
    id: 'wl-ron-swanson',
    patientName: 'Ron Swanson',
    dob: '1966/12/31',
    sex: 'M',
    age: 71,
    pid: 'Xk9Lp...Q2zM7tVa',
    resultsPreview:
      'Commodo aliquip cupidatat laborum aliquip mauris laboris cupidatat aute deserunt leo consequat risus excepteur vi...',
    protocol: '*Poly Trauma [factor...',
    markers: [
      { value: 2, tone: 'critical' },
      { value: 2, tone: 'warning' },
      { value: 1, tone: 'info' },
    ],
    state: 'opened',
  },
  {
    id: 'wl-april-ludgate',
    patientName: 'April Ludgate',
    dob: '1989/03/28',
    sex: 'F',
    age: 37,
    pid: 'LVHJEJJvw4qt2qk5',
    resultsPreview:
      'Excepteur voluptate lacus turpis sunt ad do id pariatur sed sed aliquip fames morbi tempor culpa labore do leo viverr...',
    protocol: 'Thorax, Lung Nodules',
    markers: [{ value: 1, tone: 'info' }],
    state: 'opened',
  },
  {
    id: 'wl-ben-wyatt',
    patientName: 'Ben Wyatt',
    dob: '1974/11/14',
    sex: 'M',
    age: 51,
    pid: 'lcQRlanlw8trzlAy',
    resultsPreview:
      'Pellentesque reprehenderit senectus iure cupidatat exercitation voluptate veniam consectetur officia duis sit amet q...',
    protocol: 'Stroke',
    markers: [{ value: 1, tone: 'critical' }],
    state: 'processing',
  },
  {
    id: 'wl-tammy-swanson-ii',
    patientName: 'Tammy Swanson II',
    dob: '1969/06/15',
    sex: 'F',
    age: 57,
    pid: '1Wn4zcSD8wC5T...',
    resultsPreview:
      'Qui tempor mollit et sunt senectus esse veniam egestas anim incididunt ex risus dolore tristique dolor malesuada ad...',
    protocol: '*Poly Trauma [factor...',
    markers: [
      { value: 2, tone: 'critical' },
      { value: 1, tone: 'warning' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-donna-meagle',
    patientName: 'Donna Meagle',
    dob: '1971/12/08',
    sex: 'F',
    age: 54,
    pid: 'oA1y6vGHPJjPMc...',
    resultsPreview:
      'Lacus consequat consequat sint elementum malesuada aliquip senectus habitant non occaecat cupidatat repreheder...',
    protocol: '*Poly Trauma [factor...',
    markers: [],
    state: 'processing',
  },
  {
    id: 'wl-joan-callamezzo',
    patientName: 'Joan Callamezzo',
    dob: '1970/01/05',
    sex: 'F',
    age: 56,
    pid: 'I5yeNmkdSOloGx...',
    resultsPreview:
      'Integer tristique nisi aliquip minim velit malesuada officia ut dolor ex laboris lorem adipiscing velit ut leo accumsan n...',
    protocol: '*Poly Trauma [factor...',
    markers: [{ value: 1, tone: 'critical' }],
    state: 'visited',
  },
  {
    id: 'wl-mona-lisa-saperstein',
    patientName: 'Mona-Lisa Saperstein',
    dob: '1988/05/11',
    sex: 'F',
    age: 38,
    pid: '21CFzNs3hOEGln...',
    resultsPreview:
      'Id fugiat vitae ea minim et reprehenderit consequat culpa lacus et voluptate viverra quis irure do nulla pariatur offici...',
    protocol: '*Poly Trauma [factor...',
    markers: [{ value: 7, tone: 'info' }],
    state: 'visited',
  },
  {
    id: 'wl-ethel-beavers',
    patientName: 'Ethel Beavers',
    dob: '1940/10/30',
    sex: 'F',
    age: 85,
    pid: '9b4DRxN9TxzIqO...',
    resultsPreview:
      'Fames ultricies vehicula maecenas irure facilisi non viverra praesent nisi ultricies ipsum nulla consectetur pariatur e...',
    protocol: 'Stroke',
    markers: [
      { value: 3, tone: 'warning' },
      { value: 5, tone: 'info' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-craig-middlebrooks',
    patientName: 'Craig Middlebrooks',
    dob: '1980/07/19',
    sex: 'M',
    age: 45,
    pid: 'oz2BGzp8GvuWn...',
    resultsPreview:
      'Voluptate netus integer pellentesque non malesuada facilisi consectetur consectetur ea tristique leo labore eiusmod...',
    protocol: 'Staging',
    markers: [
      { value: 1, tone: 'critical' },
      { value: 4, tone: 'warning' },
      { value: 2, tone: 'info' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-jennifer-barkley',
    patientName: 'Jennifer Barkley',
    dob: '1968/09/23',
    sex: 'F',
    age: 57,
    pid: 'f0xlivVGwraqE291',
    resultsPreview:
      'Proident morbi fames lorem tempor ullamco do nunc nisi mollit vel et duis vitae nisi nulla voluptate voluptate venia...',
    protocol: 'Lung',
    markers: [{ value: 2, tone: 'info' }],
    state: 'visited',
  },
  {
    id: 'wl-orin',
    patientName: 'Orin',
    dob: '1990/10/31',
    sex: 'M',
    age: 35,
    pid: 'J9kYcuCEhrD9ar4x',
    resultsPreview:
      'Accumsan labore deserunt vitae cupidatat nulla nulla vitae ad officia ut officia id dolor sed sed facilisi dolor ad pr...',
    protocol: 'Stroke',
    markers: [
      { value: 6, tone: 'critical' },
      { value: 1, tone: 'warning' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-bobby-newport',
    patientName: 'Bobby Newport',
    dob: '1975/07/04',
    sex: 'M',
    age: 51,
    pid: 'qdQBQkKoeB2aW...',
    resultsPreview:
      'Ut accumsan lorem fames sunt exercitation facilisi vel id esse commodo habitant quis nulla occaecat ea d...',
    protocol: 'Staging',
    markers: [
      { value: 2, tone: 'warning' },
      { value: 7, tone: 'info' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-mark-brendanawicz',
    patientName: 'Mark Brendanawicz',
    dob: '1973/04/15',
    sex: 'M',
    age: 53,
    pid: 'jwGfD8UDqPUEe...',
    resultsPreview:
      'Pariatur labore exceptur commodo ea mollit exercitation facilisi nostrud laborum elit consectetur aliquip cillum exer...',
    protocol: 'Lung',
    markers: [{ value: 5, tone: 'info' }],
    state: 'visited',
  },
  {
    id: 'wl-diane-lewis',
    patientName: 'Diane Lewis',
    dob: '1972/04/12',
    sex: 'F',
    age: 54,
    pid: 'nmzV3RPILsAx8t...',
    resultsPreview:
      'Sunt consequat facilisis nisi duis tristique nulla tristique amet velit facilisi qui ipsum aliqua viverra...',
    protocol: 'Staging',
    markers: [
      { value: 1, tone: 'warning' },
      { value: 1, tone: 'info' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-chris-traeger',
    patientName: 'Chris Traeger',
    dob: '1966/03/22',
    sex: 'M',
    age: 60,
    pid: 'eryolzjs9hM3VZAv',
    resultsPreview:
      'Consectetur nullam ultricies deserunt senectus consectetur nulla enim ullamco enim duis nunc vel enim dol...',
    protocol: 'Staging',
    markers: [
      { value: 1, tone: 'critical' },
      { value: 2, tone: 'info' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-jean-ralphio-saperstein',
    patientName: 'Jean-Ralphio Saperstein',
    dob: '1985/11/02',
    sex: 'M',
    age: 40,
    pid: 'flQfOTSff51fSJD0',
    resultsPreview:
      'Leo labore dolore commodo risus pariatur magna deserunt maecenas pellentesque voluptate consectetur nullam ma...',
    protocol: '*Poly Trauma [factor...',
    markers: [{ value: 3, tone: 'info' }],
    state: 'visited',
  },
  {
    id: 'wl-leslie-knope',
    patientName: 'Leslie Knope',
    dob: '1975/01/18',
    sex: 'F',
    age: 51,
    pid: 'R4mH2p...Ls10Yx',
    resultsPreview:
      'Proident morbi fames lorem tempor ullamco do nunc nisi mollit vel et duis vitae nisi nulla voluptate voluptate venia...',
    protocol: 'Cardiac',
    markers: [
      { value: 5, tone: 'critical' },
      { value: 1, tone: 'info' },
    ],
    state: 'opened',
  },
  {
    id: 'wl-andy-dwyer',
    patientName: 'Andy Dwyer',
    dob: '1983/11/16',
    sex: 'M',
    age: 42,
    pid: 'H8kJn9...Q23m8rJ',
    resultsPreview:
      'Lacus consequat consequat sint elementum malesuada aliquip senectus habitant non occaecat cupidatat repreheder...',
    protocol: 'Stroke',
    markers: [{ value: 2, tone: 'warning' }],
    state: 'new',
  },
  {
    id: 'wl-tom-haverford',
    patientName: 'Tom Haverford',
    dob: '1982/11/29',
    sex: 'M',
    age: 43,
    pid: 'P6sX1r...Um73Kz',
    resultsPreview:
      'Voluptate netus integer pellentesque non malesuada facilisi consectetur consectetur ea tristique leo labore eiusmod...',
    protocol: '*Poly Trauma [factor...',
    markers: [
      { value: 1, tone: 'critical' },
      { value: 1, tone: 'warning' },
      { value: 2, tone: 'info' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-ann-perkins',
    patientName: 'Ann Perkins',
    dob: '1983/04/08',
    sex: 'F',
    age: 43,
    pid: 'B2nV7j...Ga59Wu',
    resultsPreview:
      'Fames ultricies vehicula maecenas irure facilisi non viverra praesent nisi ultricies ipsum nulla consectetur pariatur e...',
    protocol: 'Lung',
    markers: [{ value: 4, tone: 'info' }],
    state: 'visited',
  },
  {
    id: 'wl-jerry-gergich',
    patientName: 'Jerry Gergich',
    dob: '1948/02/29',
    sex: 'M',
    age: 78,
    pid: 'gP9sL2...Tr84Xy',
    resultsPreview:
      'Commodo aliquip cupidatat laborum aliquip mauris laboris cupidatat aute deserunt leo consequat risus excepteur vi...',
    protocol: 'Cardiac',
    markers: [{ value: 1, tone: 'warning' }],
    state: 'visited',
  },
  {
    id: 'wl-tammy-swanson-i',
    patientName: 'Tammy Swanson I',
    dob: '1949/10/12',
    sex: 'F',
    age: 76,
    pid: 'T1mSw8...Ps91Kb',
    resultsPreview:
      'Id fugiat vitae ea minim et reprehenderit consequat culpa lacus et voluptate viverra quis irure do nulla pariatur offici...',
    protocol: 'Stroke',
    markers: [{ value: 8, tone: 'critical' }],
    state: 'visited',
  },
  {
    id: 'wl-tammy-swanson-zero',
    patientName: 'Tammy Swanson Zero',
    dob: '1939/08/04',
    sex: 'F',
    age: 87,
    pid: 'T0mSw0...Ks02Mb',
    resultsPreview:
      'Integer tristique nisi aliquip minim velit malesuada officia ut dolor ex laboris lorem adipiscing velit ut leo accumsan n...',
    protocol: '*Poly Trauma [factor...',
    markers: [
      { value: 2, tone: 'critical' },
      { value: 3, tone: 'warning' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-lil-sebastian',
    patientName: 'Lil Sebastian',
    dob: '1987/05/23',
    sex: 'M',
    age: 39,
    pid: 'L1lSb9...Ts17Hw',
    resultsPreview:
      'Sunt consequat facilisis nisi duis tristique nulla tristique amet velit facilisi qui ipsum aliqua viverra...',
    protocol: 'Lung',
    markers: [{ value: 7, tone: 'info' }],
    state: 'visited',
  },
  {
    id: 'wl-duke-silver',
    patientName: 'Duke Silver',
    dob: '1966/12/31',
    sex: 'M',
    age: 71,
    pid: 'DkSlv8...Zm92Yc',
    resultsPreview:
      'Consectetur nullam ultricies deserunt senectus consectetur nulla enim ullamco enim duis nunc vel enim dol...',
    protocol: 'Cardiac',
    markers: [
      { value: 1, tone: 'critical' },
      { value: 3, tone: 'info' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-perd-hapley',
    patientName: 'Perd Hapley',
    dob: '1959/09/14',
    sex: 'M',
    age: 66,
    pid: 'PrdHpl...Xy55Kl',
    resultsPreview:
      'Pellentesque reprehenderit senectus iure cupidatat exercitation voluptate veniam consectetur officia duis sit amet q...',
    protocol: 'Stroke',
    markers: [{ value: 3, tone: 'warning' }],
    state: 'visited',
  },
  {
    id: 'wl-shauna-malwae-tweep',
    patientName: 'Shauna Malwae-Tweep',
    dob: '1981/06/05',
    sex: 'F',
    age: 45,
    pid: 'ShnMlw...Qz82Vb',
    resultsPreview:
      'Qui tempor mollit et sunt senectus esse veniam egestas anim incididunt ex risus dolore tristique dolor malesuada ad...',
    protocol: 'Lung',
    markers: [{ value: 2, tone: 'info' }],
    state: 'visited',
  },
  {
    id: 'wl-bobby-newport-sr',
    patientName: 'Bobby Newport Sr.',
    dob: '1947/03/11',
    sex: 'M',
    age: 79,
    pid: 'BbNwpS...Xw49Lm',
    resultsPreview:
      'Excepteur voluptate lacus turpis sunt ad do id pariatur sed sed aliquip fames morbi tempor culpa labore do leo viverr...',
    protocol: 'Cardiac',
    markers: [{ value: 4, tone: 'critical' }],
    state: 'visited',
  },
  {
    id: 'wl-ken-hotate',
    patientName: 'Ken Hotate',
    dob: '1958/07/21',
    sex: 'M',
    age: 68,
    pid: 'KnHtte...Rt39Yb',
    resultsPreview:
      'Commodo aliquip cupidatat laborum aliquip mauris laboris cupidatat aute deserunt leo consequat risus excepteur vi...',
    protocol: 'Stroke',
    markers: [
      { value: 1, tone: 'warning' },
      { value: 1, tone: 'info' },
    ],
    state: 'visited',
  },
  {
    id: 'wl-barney-varmn',
    patientName: 'Barney Varmn',
    dob: '1961/11/12',
    sex: 'M',
    age: 64,
    pid: 'BrnyVr...Kl84Pm',
    resultsPreview:
      'Integer tristique nisi aliquip minim velit malesuada officia ut dolor ex laboris lorem adipiscing velit ut leo accumsan n...',
    protocol: 'Lung',
    markers: [{ value: 1, tone: 'warning' }],
    state: 'visited',
  },
  {
    id: 'wl-nadia-santos',
    patientName: 'Nadia Santos',
    dob: '1984/08/17',
    sex: 'F',
    age: 41,
    pid: 'NdSnts...Gh77Wq',
    resultsPreview:
      'Proident morbi fames lorem tempor ullamco do nunc nisi mollit vel et duis vitae nisi nulla voluptate voluptate venia...',
    protocol: 'Staging',
    markers: [{ value: 3, tone: 'info' }],
    state: 'visited',
  },
]

const WORKLIST_STATE_LABELS: Record<WorklistState, string> = {
  opened: 'Opened',
  visited: 'Visited',
  new: 'New',
  processing: 'Processing',
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const worklistSearchInputRef = useRef<HTMLInputElement>(null)
  const studyPickerRef = useRef<HTMLDivElement>(null)
  const overviewOptionsRef = useRef<HTMLDivElement>(null)
  const layoutDrawerRef = useRef<HTMLDivElement>(null)
  const stateDrawerRef = useRef<HTMLDivElement>(null)
  const notificationDrawerRef = useRef<HTMLDivElement>(null)
  const profileDrawerRef = useRef<HTMLDivElement>(null)
  const worklistMenuRef = useRef<HTMLDivElement>(null)
  const loadOlderNotificationsTimeoutRef = useRef<number | null>(null)
  const resultCardPointerDownTimeRef = useRef<number | null>(null)
  const suppressNextResultCardClickRef = useRef(false)
  const resultCardRefs = useRef<Record<string, HTMLElement | null>>({})
  const reviewImageCardRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const viewerFrameRef = useRef<HTMLDivElement>(null)
  const keyboardFindingNavigationRef = useRef(false)
  const viewerPanStateRef = useRef<ViewerPanState | null>(null)
  const [sectionWidths, setSectionWidths] = useState(STARTING_WIDTHS)
  const [selectedTreeRowId, setSelectedTreeRowId] = useState<string | null>(null)
  const [activeGlobalTab, setActiveGlobalTab] = useState<'quick' | CaseTabId>('case-1')
  const [openCaseTabIds, setOpenCaseTabIds] = useState<CaseTabId[]>(['case-1', 'case-2'])
  const [activeWorklistTab, setActiveWorklistTab] = useState('Newest')
  const [worklistSearch, setWorklistSearch] = useState('')
  const [activeFindingId, setActiveFindingId] = useState('brain-hemorrhage')
  const [activeThumbnailId, setActiveThumbnailId] = useState('thumb-1')
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isViewerFullscreen, setIsViewerFullscreen] = useState(false)
  const [filmstripVisibilityByLayout, setFilmstripVisibilityByLayout] = useState<
    Record<LayoutPreset, boolean>
  >({
    Polytrauma: true,
    'Lung Screening': false,
    'Cardiac evaluations': true,
    Stroke: true,
    'Staging scans': true,
    'Saved custom layout name': true,
  })
  const [isDedicatedViewerOpen, setIsDedicatedViewerOpen] = useState(false)
  const [activeDedicatedLeftTab, setActiveDedicatedLeftTab] = useState<DedicatedLeftTab>('images')
  const [isStudyPickerOpen, setIsStudyPickerOpen] = useState(false)
  const [isOverviewOptionsOpen, setIsOverviewOptionsOpen] = useState(false)
  const [isLayoutDrawerOpen, setIsLayoutDrawerOpen] = useState(false)
  const [isStateDrawerOpen, setIsStateDrawerOpen] = useState(false)
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false)
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false)
  const [isWorklistMenuOpen, setIsWorklistMenuOpen] = useState(false)
  const [activeNotificationFilterId, setActiveNotificationFilterId] = useState('all')
  const [overviewGroupingMode, setOverviewGroupingMode] =
    useState<OverviewGroupingMode>('body-regions')
  const [includeSourcesWithoutResults, setIncludeSourcesWithoutResults] = useState(true)
  const [isLoadingOlderNotifications, setIsLoadingOlderNotifications] = useState(false)
  const [isGroupedThumbView, setIsGroupedThumbView] = useState(false)
  const [showResultThumbnails, setShowResultThumbnails] = useState(true)
  const [isLayoutAutoDetect, setIsLayoutAutoDetect] = useState(true)
  const [layoutPresetByCase, setLayoutPresetByCase] = useState<Record<CaseTabId, LayoutPreset>>({
    'case-1': CASE_WORKSPACE_DATA['case-1'].defaultLayoutPreset,
    'case-2': CASE_WORKSPACE_DATA['case-2'].defaultLayoutPreset,
  })
  const [activeDedicatedLayout, setActiveDedicatedLayout] =
    useState<DedicatedLayoutOption>('1x1 Stack')
  const [activeStateOptionId, setActiveStateOptionId] = useState('opened')
  const [deletedFindingIds, setDeletedFindingIds] = useState<string[]>([])
  const [reviewFindingStatuses, setReviewFindingStatuses] = useState<
    Record<string, ReviewFindingStatus | undefined>
  >({})
  const [selectedDedicatedFindingByThumbnail, setSelectedDedicatedFindingByThumbnail] = useState<
    Record<string, string | null | undefined>
  >({})
  const [hoveredDedicatedFindingByThumbnail, setHoveredDedicatedFindingByThumbnail] = useState<
    Record<string, string | undefined>
  >({})
  const [deletedDedicatedFindings, setDeletedDedicatedFindings] = useState<
    Record<string, boolean>
  >({})
  const [activeFindingInfoModal, setActiveFindingInfoModal] =
    useState<FindingInfoModalState | null>(null)
  const [viewerTransform, setViewerTransform] = useState<ViewerTransform>({
    scale: VIEWER_MIN_SCALE,
    panX: 0,
    panY: 0,
  })
  const [viewerSquareSize, setViewerSquareSize] = useState<number | null>(null)
  const [selectedStudyIds, setSelectedStudyIds] = useState<string[]>(['ct-2026', 'ct-2025'])
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  const activeCaseTabId: CaseTabId = activeGlobalTab === 'case-2' ? 'case-2' : 'case-1'
  const caseData = CASE_WORKSPACE_DATA[activeCaseTabId]
  const activeLayoutPreset = layoutPresetByCase[activeCaseTabId] ?? caseData.defaultLayoutPreset
  const isViewerFilmstripVisible = filmstripVisibilityByLayout[activeLayoutPreset] ?? true
  const isLungScreeningTemplate = activeLayoutPreset === 'Lung Screening'
  const usesLungMap = isLungScreeningTemplate && caseData.anatomyVisualization === 'lungs'
  const FINDINGS = caseData.findings
  const THUMBNAILS = caseData.thumbnails
  const STUDY_TREE = caseData.studyTree
  const THUMBNAIL_GROUPS = caseData.thumbnailGroups
  const IMAGE_FINDING_COUNTS = caseData.imageFindingCounts
  const IMAGE_FINDINGS_BY_THUMBNAIL: Record<string, ImageFinding[]> = Object.fromEntries(
    THUMBNAILS.map((thumbnail) => [
      thumbnail.id,
      createImageFindings(thumbnail.id, IMAGE_FINDING_COUNTS[thumbnail.id] ?? 3),
    ]),
  ) as Record<string, ImageFinding[]>

  const activeFinding =
    FINDINGS.find((finding) => finding.id === activeFindingId) ?? FINDINGS[0]
  const activeThumbnail =
    THUMBNAILS.find((thumbnail) => thumbnail.id === activeThumbnailId) ?? THUMBNAILS[0]
  const activeFindingThumbnails = THUMBNAILS.filter(
    (thumbnail) => thumbnail.findingId === activeFinding.id,
  )
  const activeDedicatedFindings = IMAGE_FINDINGS_BY_THUMBNAIL[activeThumbnail.id] ?? []
  const getThumbnailImageStyle = (thumbnailId: string): CSSProperties | undefined => {
    if (
      thumbnailId === 'thumb-case2-thorax-1' ||
      thumbnailId === 'thumb-case2-thorax-3' ||
      thumbnailId === 'thumb-case2-thorax-4'
    ) {
      return {
        backgroundImage: `url(${lung01Image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    }

    if (thumbnailId === 'thumb-case2-thorax-2') {
      return {
        backgroundImage: `url(${aircScImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    }

    return undefined
  }

  const selectedDedicatedFindingState = selectedDedicatedFindingByThumbnail[activeThumbnail.id]
  const selectedDedicatedFindingId =
    selectedDedicatedFindingState === null
      ? null
      : selectedDedicatedFindingState ?? activeDedicatedFindings[0]?.id ?? null
  const hoveredDedicatedFindingId = hoveredDedicatedFindingByThumbnail[activeThumbnail.id] ?? null
  const minSectionWidths = isDedicatedViewerOpen
    ? DEDICATED_MIN_SECTION_WIDTHS
    : MIN_SECTION_WIDTHS
  const visibleTreeNodes = STUDY_TREE[0]?.children ?? []

  const puppetBadgeDots = caseData.puppetBadgeDots.filter(({ findingId }) =>
    FINDINGS.some((finding) => finding.id === findingId),
  )

  const selectLayoutPreset = (layoutPreset: LayoutPreset) => {
    setLayoutPresetByCase((current) => ({
      ...current,
      [activeCaseTabId]: layoutPreset,
    }))
  }

  const toggleFilmstripVisibility = () => {
    setFilmstripVisibilityByLayout((current) => ({
      ...current,
      [activeLayoutPreset]: !(current[activeLayoutPreset] ?? true),
    }))
  }

  const renderFindingMap = () => {
    const anatomyImage = usesLungMap ? lungsImage : bodyPuppetImage
    const anatomyClassName = usesLungMap ? 'lungs-map-svg' : 'body-puppet-svg'

    return (
      <div className={`body-outline ${usesLungMap ? 'body-outline-lungs' : ''}`}>
        <div className={`body-silhouette-wrap ${usesLungMap ? 'lungs-silhouette-wrap' : ''}`}>
          <img className={anatomyClassName} src={anatomyImage} alt="" />

          <div className={`puppet-badges-layer ${usesLungMap ? 'lungs-badges-layer' : ''}`}>
            {puppetBadgeDots.map(({ findingId, top, left }, index) => {
              const isDotActive = activeFindingId === findingId && isViewerOpen

              return (
                <span
                  key={`${findingId}-${index}`}
                  className={`puppet-badge-hitbox ${isDotActive ? 'is-active' : ''}`}
                  style={{ top, left }}
                >
                  <button
                    type="button"
                    className={`puppet-badge-dot ${isDotActive ? 'is-active' : ''}`}
                    onClick={() => handlePuppetDotClick(findingId)}
                    aria-label={`Select ${FINDINGS.find((entry) => entry.id === findingId)?.title ?? 'related finding'}`}
                  />
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (activeGlobalTab === 'quick') {
      return
    }

    if (isLungScreeningTemplate) {
      setIsGroupedThumbView(true)
      return
    }

    setIsGroupedThumbView(false)
  }, [activeGlobalTab, isLungScreeningTemplate])

  useEffect(() => {
    if (activeGlobalTab === 'quick') {
      return
    }

    if (!FINDINGS.some((finding) => finding.id === activeFindingId)) {
      setActiveFindingId(caseData.defaultFindingId)
    }

    if (!THUMBNAILS.some((thumbnail) => thumbnail.id === activeThumbnailId)) {
      setActiveThumbnailId(caseData.defaultThumbnailId)
    }

    if (!selectedTreeRowId) {
      return
    }

    const hasNode = (nodes: StudyTreeNode[], nodeId: string): boolean =>
      nodes.some((node) => node.id === nodeId || hasNode(node.children ?? [], nodeId))

    if (!hasNode(STUDY_TREE, selectedTreeRowId)) {
      setSelectedTreeRowId(null)
    }
  }, [
    activeGlobalTab,
    FINDINGS,
    THUMBNAILS,
    STUDY_TREE,
    activeFindingId,
    activeThumbnailId,
    selectedTreeRowId,
    caseData.defaultFindingId,
    caseData.defaultThumbnailId,
  ])

  const handlePuppetDotClick = (findingId: string) => {
    const finding = FINDINGS.find((entry) => entry.id === findingId)
    if (!finding) {
      return
    }

    activateFindingCard(finding.id, finding.nodeId)
  }
  const selectedStudyCount = selectedStudyIds.length

  const activeThumbnailIndex = activeFindingThumbnails.findIndex(
    (thumbnail) => thumbnail.id === activeThumbnail.id,
  )

  const selectViewerThumbnail = (direction: -1 | 1) => {
    if (THUMBNAILS.length === 0) {
      return
    }

    if (!selectedTreeRowId && !isViewerOpen) {
      const firstFinding = FINDINGS[0]
      if (!firstFinding) {
        return
      }

      const firstThumbnail = THUMBNAILS.find((thumbnail) => thumbnail.findingId === firstFinding.id)
      openViewer(firstFinding.id, firstFinding.nodeId, firstThumbnail?.id)
      return
    }

    if (activeFindingThumbnails.length === 0) {
      const fallbackFinding = FINDINGS.find((finding) =>
        THUMBNAILS.some((thumbnail) => thumbnail.findingId === finding.id),
      )
      if (!fallbackFinding) {
        return
      }

      const fallbackThumbnail = THUMBNAILS.find(
        (thumbnail) => thumbnail.findingId === fallbackFinding.id,
      )
      if (fallbackThumbnail) {
        openViewer(fallbackFinding.id, undefined, fallbackThumbnail.id)
      }
      return
    }

    const currentIndex = activeFindingThumbnails.findIndex(
      (thumbnail) => thumbnail.id === activeThumbnail.id,
    )
    const resolvedCurrentIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = resolvedCurrentIndex + direction

    if (nextIndex >= 0 && nextIndex < activeFindingThumbnails.length) {
      const nextThumbnail = activeFindingThumbnails[nextIndex]
      if (nextThumbnail) {
        openViewer(activeFinding.id, undefined, nextThumbnail.id)
      }
      return
    }

    const currentFindingIndex = FINDINGS.findIndex((finding) => finding.id === activeFinding.id)
    if (currentFindingIndex < 0) {
      return
    }

    for (let offset = 1; offset <= FINDINGS.length; offset += 1) {
      const candidateFindingIndex =
        (currentFindingIndex + direction * offset + FINDINGS.length) % FINDINGS.length
      const candidateFinding = FINDINGS[candidateFindingIndex]
      const candidateThumbnails = THUMBNAILS.filter(
        (thumbnail) => thumbnail.findingId === candidateFinding.id,
      )

      if (candidateThumbnails.length === 0) {
        continue
      }

      const boundaryThumbnail =
        direction === 1
          ? candidateThumbnails[0]
          : candidateThumbnails[candidateThumbnails.length - 1]
      openViewer(candidateFinding.id, undefined, boundaryThumbnail.id)
      return
    }
  }

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return
      }

      if (!selectedTreeRowId && !isViewerOpen) {
        const firstFinding = FINDINGS[0]
        if (!firstFinding) {
          return
        }

        const firstThumbnail = THUMBNAILS.find((thumbnail) => thumbnail.findingId === firstFinding.id)
        event.preventDefault()
        keyboardFindingNavigationRef.current = true
        openViewer(firstFinding.id, firstFinding.nodeId, firstThumbnail?.id)
        return
      }

      event.preventDefault()
      keyboardFindingNavigationRef.current = true
      if (event.key === 'ArrowLeft') {
        selectViewerThumbnail(-1)
      } else {
        selectViewerThumbnail(1)
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [isViewerOpen, selectedTreeRowId, activeFinding.id, activeThumbnail.id, activeFindingThumbnails, activeThumbnail])

  useEffect(() => {
    const handleRestartShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        window.location.reload()
      }
    }

    window.addEventListener('keydown', handleRestartShortcut)
    return () => {
      window.removeEventListener('keydown', handleRestartShortcut)
    }
  }, [])

  useEffect(() => {
    if (activeGlobalTab === 'quick') {
      setIsDedicatedViewerOpen(false)
    }
  }, [activeGlobalTab])

  useEffect(() => {
    if (!isDedicatedViewerOpen || activeDedicatedFindings.length === 0) {
      return
    }

    setSelectedDedicatedFindingByThumbnail((current) => {
      const hasEntry = Object.prototype.hasOwnProperty.call(current, activeThumbnail.id)
      const selectedId = current[activeThumbnail.id]

      if (hasEntry && selectedId === null) {
        return current
      }

      const stillExists = selectedId
        ? activeDedicatedFindings.some((finding) => finding.id === selectedId)
        : false

      if (stillExists || (hasEntry && selectedId !== undefined)) {
        return current
      }

      return {
        ...current,
        [activeThumbnail.id]: activeDedicatedFindings[0].id,
      }
    })
  }, [isDedicatedViewerOpen, activeThumbnail.id, activeDedicatedFindings])

  useEffect(() => {
    if (!activeFindingInfoModal) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveFindingInfoModal(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [activeFindingInfoModal])

  useEffect(() => {
    if (!isViewerFullscreen) {
      return
    }

    const handleViewerFullscreenEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsViewerFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleViewerFullscreenEscape)
    return () => {
      window.removeEventListener('keydown', handleViewerFullscreenEscape)
    }
  }, [isViewerFullscreen])

  useEffect(() => {
    setViewerTransform({
      scale: VIEWER_MIN_SCALE,
      panX: 0,
      panY: 0,
    })
    viewerPanStateRef.current = null
  }, [activeThumbnail.id, isViewerOpen])

  useEffect(() => {
    if (!isViewerOpen) {
      return
    }

    const frameElement = viewerFrameRef.current
    if (!frameElement) {
      return
    }

    const updateViewerSquareSize = () => {
      const nextSize = Math.max(0, Math.floor(Math.min(frameElement.clientWidth, frameElement.clientHeight) - 8))

      setViewerSquareSize((current) => (current === nextSize ? current : nextSize))
    }

    updateViewerSquareSize()

    const resizeObserver = new ResizeObserver(updateViewerSquareSize)
    resizeObserver.observe(frameElement)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isViewerOpen, activeThumbnail.id, isDedicatedViewerOpen])

  useEffect(() => {
    if (!isViewerOpen) {
      return
    }

    const activeResultCard = resultCardRefs.current[activeFinding.id]
    if (!activeResultCard) {
      return
    }

    requestAnimationFrame(() => {
      if (keyboardFindingNavigationRef.current) {
        activeResultCard.focus({ preventScroll: true })
        keyboardFindingNavigationRef.current = false
      }

      const scrollContainer = activeResultCard.closest('.panel-right') as HTMLElement | null
      if (!scrollContainer) {
        activeResultCard.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: 'smooth',
        })
        return
      }

      const header = scrollContainer.querySelector('.panel-header') as HTMLElement | null
      const headerHeight = header?.offsetHeight ?? 56
      const topPadding = headerHeight + 8
      const bottomPadding = 8

      const cardTop = activeResultCard.offsetTop
      const cardBottom = cardTop + activeResultCard.offsetHeight
      const visibleTop = scrollContainer.scrollTop + topPadding
      const visibleBottom = scrollContainer.scrollTop + scrollContainer.clientHeight - bottomPadding

      if (cardTop < visibleTop) {
        scrollContainer.scrollTo({
          top: Math.max(0, cardTop - topPadding),
          behavior: 'smooth',
        })
        return
      }

      if (cardBottom > visibleBottom) {
        scrollContainer.scrollTo({
          top: cardBottom - scrollContainer.clientHeight + bottomPadding,
          behavior: 'smooth',
        })
      }
    })
  }, [activeFinding.id, isViewerOpen])

  useEffect(() => {
    if (!isDedicatedViewerOpen || activeDedicatedLeftTab !== 'images') {
      return
    }

    const activeImageCard = reviewImageCardRefs.current[activeThumbnail.id]
    if (!activeImageCard) {
      return
    }

    requestAnimationFrame(() => {
      const scrollContainer = activeImageCard.closest('.panel-left') as HTMLElement | null
      if (!scrollContainer) {
        activeImageCard.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: 'smooth',
        })
        return
      }

      const tabsHeader = scrollContainer.querySelector('.review-images-header') as HTMLElement | null
      const stickyOffset = (tabsHeader?.offsetHeight ?? 0) + 8
      const bottomPadding = 8

      const cardTop = activeImageCard.offsetTop
      const cardBottom = cardTop + activeImageCard.offsetHeight
      const visibleTop = scrollContainer.scrollTop + stickyOffset
      const visibleBottom =
        scrollContainer.scrollTop + scrollContainer.clientHeight - bottomPadding

      if (cardTop < visibleTop) {
        scrollContainer.scrollTo({
          top: Math.max(0, cardTop - stickyOffset),
          behavior: 'smooth',
        })
        return
      }

      if (cardBottom > visibleBottom) {
        scrollContainer.scrollTo({
          top: cardBottom - scrollContainer.clientHeight + bottomPadding,
          behavior: 'smooth',
        })
      }
    })
  }, [isDedicatedViewerOpen, activeDedicatedLeftTab, activeThumbnail.id])

  const hasActiveTextSelection = () => {
    const selection = window.getSelection()
    return Boolean(selection && selection.toString().trim())
  }

  const clampViewerScale = (scale: number) =>
    Math.min(VIEWER_MAX_SCALE, Math.max(VIEWER_MIN_SCALE, scale))

  const adjustViewerScale = (direction: -1 | 1) => {
    setViewerTransform((current) => ({
      scale: clampViewerScale(current.scale + direction * 0.16),
      panX: current.panX,
      panY: current.panY,
    }))
  }

  const toggleViewerFullscreen = () => {
    setIsViewerFullscreen((current) => !current)
  }

  const handleViewerWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const scaleMultiplier = Math.exp(-event.deltaY * VIEWER_ZOOM_STEP)

    setViewerTransform((current) => {
      const nextScale = clampViewerScale(current.scale * scaleMultiplier)

      return {
        scale: nextScale,
        panX: current.panX,
        panY: current.panY,
      }
    })
  }

  const handleViewerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }

    viewerPanStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: viewerTransform.panX,
      startPanY: viewerTransform.panY,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleViewerPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panState = viewerPanStateRef.current
    if (!panState || panState.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - panState.startX
    const deltaY = event.clientY - panState.startY

    setViewerTransform({
      scale: viewerTransform.scale,
      panX: panState.startPanX + deltaX,
      panY: panState.startPanY + deltaY,
    })
  }

  const finishViewerPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panState = viewerPanStateRef.current
    if (!panState || panState.pointerId !== event.pointerId) {
      return
    }

    viewerPanStateRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const activateFindingCard = (findingId: string, treeRowId: string) => {
    if (activeFinding.id === findingId && isViewerOpen) {
      closeViewer()
      return
    }

    openViewer(findingId, treeRowId)
  }

  const stopActionEvent = (event: ReactPointerEvent | React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const openFindingInfoModal = (findingName: string) => {
    setActiveFindingInfoModal({ findingName })
  }

  const closeFindingInfoModal = () => {
    setActiveFindingInfoModal(null)
  }

  const handleResultCardPointerDown = () => {
    resultCardPointerDownTimeRef.current = performance.now()
    suppressNextResultCardClickRef.current = false
  }

  const handleResultCardPointerUp = (findingId: string, treeRowId: string) => {
    const pointerDownTime = resultCardPointerDownTimeRef.current
    resultCardPointerDownTimeRef.current = null

    const elapsedMs = pointerDownTime === null ? 0 : performance.now() - pointerDownTime
    const selectionExists = hasActiveTextSelection()
    const isSelectionGesture = selectionExists || elapsedMs > 220

    suppressNextResultCardClickRef.current = true

    if (isSelectionGesture) {
      return
    }

    activateFindingCard(findingId, treeRowId)
  }

  const handleResultCardClick = () => {
    if (suppressNextResultCardClickRef.current) {
      suppressNextResultCardClickRef.current = false
      return
    }
  }

  const toggleStudySelection = (studyId: string) => {
    setSelectedStudyIds((current) =>
      current.includes(studyId)
        ? current.filter((id) => id !== studyId)
        : [...current, studyId],
    )
  }

  const openViewer = (findingId: string, treeRowId?: string, thumbnailId?: string) => {
    const finding = FINDINGS.find((entry) => entry.id === findingId)
    if (!finding) {
      return
    }

    const resolvedTreeRowId = treeRowId ?? finding.nodeId
    const resolvedThumbnail = thumbnailId
      ? THUMBNAILS.find((thumbnail) => thumbnail.id === thumbnailId)
      : THUMBNAILS.find((thumbnail) => thumbnail.findingId === findingId)

    ensureNodePathExpanded(resolvedTreeRowId)

    setActiveFindingId(finding.id)
    if (resolvedThumbnail) {
      setActiveThumbnailId(resolvedThumbnail.id)
    }
    setSelectedTreeRowId(resolvedTreeRowId)
    setIsViewerOpen(true)
  }

  const closeViewer = (nextSelectedTreeRowId: string | null = null) => {
    setSelectedTreeRowId(nextSelectedTreeRowId)
    setIsViewerOpen(false)
    setIsViewerFullscreen(false)
  }

  const openDedicatedViewer = () => {
    setIsViewerOpen(true)
    setIsDedicatedViewerOpen(true)
    setActiveDedicatedLeftTab('images')
    setIsViewerFullscreen(false)
  }

  const openDedicatedViewerFromSource = (
    sourceTab: DedicatedLeftTab,
    findingId: string,
    treeRowId?: string,
    thumbnailId?: string,
  ) => {
    openViewer(findingId, treeRowId, thumbnailId)
    setIsDedicatedViewerOpen(true)
    setActiveDedicatedLeftTab(sourceTab)
    setIsViewerFullscreen(false)
  }

  const closeDedicatedViewer = () => {
    setIsDedicatedViewerOpen(false)
    setIsViewerFullscreen(false)
  }

  const selectDedicatedThumbnail = (thumbnailId: string) => {
    const thumbnail = THUMBNAILS.find((entry) => entry.id === thumbnailId)
    if (!thumbnail) {
      return
    }

    const finding = FINDINGS.find((entry) => entry.id === thumbnail.findingId)
    if (!finding) {
      return
    }

    setActiveThumbnailId(thumbnail.id)
    setActiveFindingId(finding.id)
    setSelectedTreeRowId(finding.nodeId)
    setIsViewerOpen(true)
  }

  const selectDedicatedFinding = (thumbnailId: string, findingId: string) => {
    setSelectedDedicatedFindingByThumbnail((current) => ({
      ...current,
      [thumbnailId]: findingId,
    }))
  }

  const deselectDedicatedFinding = (thumbnailId: string) => {
    setSelectedDedicatedFindingByThumbnail((current) => ({
      ...current,
      [thumbnailId]: null,
    }))
    setHoveredDedicatedFindingByThumbnail((current) => ({
      ...current,
      [thumbnailId]: undefined,
    }))
  }

  const setReviewFindingStatus = (
    thumbnailId: string,
    findingId: string,
    nextStatus: ReviewFindingStatus,
  ) => {
    const statusKey = `${thumbnailId}::${findingId}`
    setReviewFindingStatuses((current) => ({
      ...current,
      [statusKey]: current[statusKey] === nextStatus ? undefined : nextStatus,
    }))
  }

  const deleteDedicatedFinding = (thumbnailId: string, findingId: string) => {
    const statusKey = `${thumbnailId}::${findingId}`
    setDeletedDedicatedFindings((current) => ({
      ...current,
      [statusKey]: true,
    }))
  }

  const restoreDedicatedFinding = (thumbnailId: string, findingId: string) => {
    const statusKey = `${thumbnailId}::${findingId}`
    setDeletedDedicatedFindings((current) => ({
      ...current,
      [statusKey]: false,
    }))
  }

  const acceptAllDedicatedFindings = (thumbnailId: string, findings: ImageFinding[]) => {
    setReviewFindingStatuses((current) => {
      const next = { ...current }

      findings.forEach((finding) => {
        next[`${thumbnailId}::${finding.id}`] = 'accepted'
      })

      return next
    })

    setDeletedDedicatedFindings((current) => {
      const next = { ...current }

      findings.forEach((finding) => {
        next[`${thumbnailId}::${finding.id}`] = false
      })

      return next
    })
  }

  const rejectAllDedicatedFindings = (thumbnailId: string, findings: ImageFinding[]) => {
    setReviewFindingStatuses((current) => {
      const next = { ...current }

      findings.forEach((finding) => {
        next[`${thumbnailId}::${finding.id}`] = 'rejected'
      })

      return next
    })

    setDeletedDedicatedFindings((current) => {
      const next = { ...current }

      findings.forEach((finding) => {
        next[`${thumbnailId}::${finding.id}`] = true
      })

      return next
    })
  }

  const deleteFinding = (findingId: string) => {
    setDeletedFindingIds((current) => (
      current.includes(findingId) ? current : [...current, findingId]
    ))

    if (activeFindingId === findingId && isViewerOpen) {
      closeViewer()
    }
  }

  const restoreFinding = (findingId: string) => {
    setDeletedFindingIds((current) => current.filter((id) => id !== findingId))
  }

  const findFirstFindingId = (node: StudyTreeNode): string | null => {
    if (node.findingId) {
      return node.findingId
    }

    for (const child of node.children ?? []) {
      const found = findFirstFindingId(child)
      if (found) {
        return found
      }
    }

    return null
  }

  const findFirstThumbnailId = (node: StudyTreeNode): string | null => {
    if (node.thumbnailId) {
      return node.thumbnailId
    }

    for (const child of node.children ?? []) {
      const found = findFirstThumbnailId(child)
      if (found) {
        return found
      }
    }

    return null
  }

  const findNodePath = (nodeId: string, nodes: StudyTreeNode[] = STUDY_TREE[0]?.children ?? []): StudyTreeNode[] => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return [node]
      }

      if (node.children && node.children.length > 0) {
        const childPath = findNodePath(nodeId, node.children)
        if (childPath.length > 0) {
          return [node, ...childPath]
        }
      }
    }

    return []
  }

  const ensureNodePathExpanded = (nodeId: string) => {
    const path = findNodePath(nodeId)
    if (path.length === 0) {
      return
    }

    setExpandedNodes((current) => {
      const next = { ...current }
      for (const node of path.slice(0, -1)) {
        if (node.children && node.children.length > 0) {
          next[node.id] = true
        }
      }
      return next
    })
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((current) => ({
      ...current,
      [nodeId]: !current[nodeId],
    }))
  }

  const countItemsInFolder = (node: StudyTreeNode): number => {
    if (!node.children || node.children.length === 0) {
      return node.count ?? 1
    }

    return node.children.reduce((total, child) => total + countItemsInFolder(child), 0)
  }

  const renderTree = (nodes: StudyTreeNode[], depth = 0) => {
    return (
      <ul className="tree-level" role={depth === 0 ? 'tree' : 'group'}>
        {nodes.map((node) => {
          const hasChildren = Boolean(node.children && node.children.length)
          const isStudyRow = node.id === 'ct-main'
          const isFolderRow = hasChildren && !isStudyRow
          const expanded = hasChildren ? Boolean(expandedNodes[node.id]) : false
          const targetFindingId = node.findingId ?? findFirstFindingId(node)
          const targetThumbnailId = node.thumbnailId ?? findFirstThumbnailId(node)
          const isSelectableFinding = Boolean(node.findingId || node.thumbnailId) && !hasChildren
          const isSelected = isSelectableFinding && selectedTreeRowId === node.id
          const folderItemCount = isFolderRow ? countItemsInFolder(node) : null
          const labelText = node.label

          return (
            <li
              key={node.id}
              className={`tree-node ${hasChildren ? 'tree-node-group' : 'tree-node-leaf'}`}
              role="treeitem"
              aria-expanded={hasChildren ? expanded : undefined}
            >
              <div
                className={`tree-row ${isSelected ? 'is-selected' : ''}`}
                style={{ '--tree-depth': depth } as CSSProperties}
              >
                {hasChildren && !isStudyRow ? (
                  <button
                    type="button"
                    className={`tree-toggle ${expanded ? 'is-open' : ''}`}
                    onClick={() => toggleNode(node.id)}
                    aria-label={`Toggle ${node.label}`}
                  >
                    <span className="material-symbols-outlined tree-toggle-icon" aria-hidden="true">
                      chevron_right
                    </span>
                  </button>
                ) : !isStudyRow ? (
                  <span className="tree-toggle tree-toggle-placeholder" aria-hidden="true">
                    <span className="material-symbols-outlined tree-toggle-icon">
                      chevron_right
                    </span>
                  </span>
                ) : null}

                <button
                  type="button"
                  className={`tree-select ${isSelected ? 'is-selected' : ''} ${
                    isStudyRow ? 'tree-select-study' : ''
                  }`}
                  onClick={(event) => {
                    if (event.detail > 1) {
                      return
                    }

                    if (isStudyRow) {
                      closeViewer(node.id)
                      return
                    }

                    if (isFolderRow) {
                      toggleNode(node.id)
                      return
                    }

                    if (!isSelectableFinding) {
                      return
                    }

                    if (isSelected && isViewerOpen) {
                      closeViewer()
                      return
                    }

                    setSelectedTreeRowId(node.id)
                    if (isSelectableFinding && targetFindingId) {
                      openViewer(targetFindingId, node.id, targetThumbnailId ?? undefined)
                    }
                  }}
                  onDoubleClick={() => {
                    if (!isSelectableFinding || !targetFindingId) {
                      return
                    }

                    openDedicatedViewerFromSource(
                      'overview',
                      targetFindingId,
                      node.id,
                      targetThumbnailId ?? undefined,
                    )
                  }}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  {isStudyRow ? (
                    <span className="tree-folder-icon material-symbols-outlined" aria-hidden="true">
                      folder
                    </span>
                  ) : null}
                  <span className="tree-label">{labelText}</span>

                  {folderItemCount !== null ? (
                    <span className="tree-count">{folderItemCount} findings</span>
                  ) : null}

                  {node.metricValue ? (
                    <span className="tree-metric">{node.metricValue}</span>
                  ) : null}

                </button>

              </div>

              {hasChildren && expanded ? renderTree(node.children!, depth + 1) : null}
            </li>
          )
        })}
      </ul>
    )
  }

  const applyResize = (
    widths: number[],
    divider: Divider,
    deltaPercent: number,
    containerWidth: number,
  ) => {
    const minPercent = minSectionWidths.map(
      (minWidthPx) => (minWidthPx / containerWidth) * 100,
    )

    if (divider === 0) {
      const rightFixed = widths[2]
      const minLeft = minPercent[0]
      const minCenter = minPercent[1]
      const maxLeft = 100 - rightFixed - minCenter
      const nextLeft = Math.min(
        Math.max(widths[0] + deltaPercent, minLeft),
        maxLeft,
      )
      const nextCenter = 100 - rightFixed - nextLeft
      return [nextLeft, nextCenter, rightFixed]
    }

    const leftFixed = widths[0]
    const minCenter = minPercent[1]
    const minRight = minPercent[2]
    const maxCenter = 100 - leftFixed - minRight
    const nextCenter = Math.min(
      Math.max(widths[1] + deltaPercent, minCenter),
      maxCenter,
    )
    const nextRight = 100 - leftFixed - nextCenter
    return [leftFixed, nextCenter, nextRight]
  }

  const handleDividerPointerDown = (
    divider: Divider,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (window.innerWidth < MOBILE_BREAKPOINT || !containerRef.current) {
      return
    }

    const containerWidth = containerRef.current.getBoundingClientRect().width
    dragStateRef.current = {
      divider,
      startX: event.clientX,
      startWidths: [...sectionWidths],
      containerWidth,
    }

    document.body.classList.add('is-resizing')
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleDividerKeyDown = (
    divider: Divider,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (!containerRef.current) {
      return
    }

    let keyboardDelta = 0
    if (event.key === 'ArrowLeft') {
      keyboardDelta = -2
    }
    if (event.key === 'ArrowRight') {
      keyboardDelta = 2
    }

    if (!keyboardDelta) {
      return
    }

    event.preventDefault()
    const containerWidth = containerRef.current.getBoundingClientRect().width
    setSectionWidths((current) =>
      applyResize(current, divider, keyboardDelta, containerWidth),
    )
  }

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current
      if (!dragState) {
        return
      }

      const deltaPercent =
        ((event.clientX - dragState.startX) / dragState.containerWidth) * 100

      setSectionWidths(
        applyResize(
          dragState.startWidths,
          dragState.divider,
          deltaPercent,
          dragState.containerWidth,
        ),
      )
    }

    const stopDrag = () => {
      if (!dragStateRef.current) {
        return
      }

      dragStateRef.current = null
      document.body.classList.remove('is-resizing')
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDrag)
    window.addEventListener('pointercancel', stopDrag)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDrag)
      window.removeEventListener('pointercancel', stopDrag)
    }
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isStudyPickerOpen || !studyPickerRef.current) {
        return
      }

      if (!studyPickerRef.current.contains(event.target as Node)) {
        setIsStudyPickerOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isStudyPickerOpen])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isOverviewOptionsOpen || !overviewOptionsRef.current) {
        return
      }

      if (!overviewOptionsRef.current.contains(event.target as Node)) {
        setIsOverviewOptionsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOverviewOptionsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOverviewOptionsOpen])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isLayoutDrawerOpen || !layoutDrawerRef.current) {
        return
      }

      if (!layoutDrawerRef.current.contains(event.target as Node)) {
        setIsLayoutDrawerOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLayoutDrawerOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLayoutDrawerOpen])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isStateDrawerOpen || !stateDrawerRef.current) {
        return
      }

      if (!stateDrawerRef.current.contains(event.target as Node)) {
        setIsStateDrawerOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStateDrawerOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isStateDrawerOpen])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isNotificationDrawerOpen || !notificationDrawerRef.current) {
        return
      }

      if (!notificationDrawerRef.current.contains(event.target as Node)) {
        setIsNotificationDrawerOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationDrawerOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isNotificationDrawerOpen])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isProfileDrawerOpen || !profileDrawerRef.current) {
        return
      }

      if (!profileDrawerRef.current.contains(event.target as Node)) {
        setIsProfileDrawerOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileDrawerOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileDrawerOpen])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isWorklistMenuOpen || !worklistMenuRef.current) {
        return
      }

      if (!worklistMenuRef.current.contains(event.target as Node)) {
        setIsWorklistMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsWorklistMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isWorklistMenuOpen])

  useEffect(() => {
    return () => {
      if (loadOlderNotificationsTimeoutRef.current !== null) {
        window.clearTimeout(loadOlderNotificationsTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (activeGlobalTab === 'quick') {
      return
    }

    if (openCaseTabIds.includes(activeGlobalTab)) {
      return
    }

    setActiveGlobalTab(openCaseTabIds[0] ?? 'quick')
  }, [activeGlobalTab, openCaseTabIds])

  const openCaseTab = (caseTabId: CaseTabId) => {
    setOpenCaseTabIds((current) =>
      current.includes(caseTabId) ? current : [...current, caseTabId],
    )
    setActiveGlobalTab(caseTabId)
  }

  const closeCaseTab = (caseTabId: CaseTabId) => {
    setOpenCaseTabIds((current) => {
      if (!current.includes(caseTabId)) {
        return current
      }

      const nextOpenTabs = current.filter((entry) => entry !== caseTabId)

      if (activeGlobalTab === caseTabId) {
        setActiveGlobalTab(nextOpenTabs[0] ?? 'quick')
      }

      return nextOpenTabs
    })
  }

  const renderQuickSearchScreen = () => {
    return (
      <div className="app-shell">
        <header className="global-topbar" aria-label="Workspace tabs and actions">
          <div className="global-topbar-tabs">
            <button
              type="button"
              className="global-tab global-tab-icon-only is-active"
              aria-label="Open quick tab"
              onClick={() => setActiveGlobalTab('quick')}
            >
              <span className="global-tab-person material-symbols-outlined" aria-hidden="true">
                search
              </span>
            </button>

            {CASE_TABS.filter((tab) => openCaseTabIds.includes(tab.id)).map((tab) => (
              <div key={tab.id} className="global-tab-shell">
                <button
                  type="button"
                  className={`global-tab ${activeGlobalTab === tab.id ? 'is-active' : ''}`}
                  aria-label={`Open ${tab.name}`}
                  onClick={() => setActiveGlobalTab(tab.id)}
                >
                  <span className="global-tab-person material-symbols-outlined" aria-hidden="true">
                    man
                  </span>
                  <span className="global-tab-copy">
                    <span className="global-tab-title">{tab.name}</span>
                    <span className="global-tab-meta">{tab.meta}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="global-tab-close material-symbols-outlined"
                  aria-label={`Close ${tab.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    closeCaseTab(tab.id)
                  }}
                >
                  close
                </button>
              </div>
            ))}
          </div>

          <div className="global-topbar-actions">
            <button type="button" className="global-icon-btn material-symbols-outlined" aria-label="Refresh worklist">
              refresh
            </button>

            <div
              className={`global-notification-menu ${isNotificationDrawerOpen ? 'is-open' : ''}`}
              ref={notificationDrawerRef}
            >
              <button
                type="button"
                className="global-icon-btn material-symbols-outlined"
                aria-label="Notifications"
                aria-expanded={isNotificationDrawerOpen}
                aria-controls="notifications-drawer"
                onClick={() => {
                  setIsLayoutDrawerOpen(false)
                  setIsStateDrawerOpen(false)
                  setIsProfileDrawerOpen(false)
                  setIsNotificationDrawerOpen((current) => !current)
                }}
              >
                notifications
              </button>

              {isNotificationDrawerOpen ? (
                <div
                  id="notifications-drawer"
                  className="notifications-drawer"
                  role="dialog"
                  aria-label="Alerts and notifications"
                >
                  <div className="notifications-drawer-header">
                    <h2>Alerts &amp; notifications</h2>
                  </div>

                  <div className="notifications-filter-row" role="tablist" aria-label="Notification filters">
                    {NOTIFICATION_FILTERS.map((filterOption) => {
                      const isActive = activeNotificationFilterId === filterOption.id
                      return (
                        <button
                          type="button"
                          key={filterOption.id}
                          role="tab"
                          aria-selected={isActive}
                          className={`notifications-filter-btn ${isActive ? 'is-active' : ''}`}
                          onClick={() => setActiveNotificationFilterId(filterOption.id)}
                        >
                          {filterOption.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="notifications-list" role="list" aria-label="Alert results">
                    {NOTIFICATION_ITEMS.map((notificationItem, notificationIndex) => (
                      <article
                        key={notificationItem.id}
                        className={`notification-row ${notificationIndex < 2 ? 'is-unread' : ''}`}
                        role="listitem"
                      >
                        <div className="notification-row-main">
                          <p className="notification-row-name">{notificationItem.patientName}</p>
                          <p className="notification-row-meta">{notificationItem.demographics}</p>
                          <p className="notification-row-id">{notificationItem.accession}</p>
                        </div>

                        <div className="notification-row-side">
                          <p className={`notification-row-finding ${notificationItem.findingTone === 'empty' ? 'is-empty' : ''}`}>
                            {notificationItem.finding}
                          </p>

                          {notificationItem.extraFindingLine ? (
                            <p className="notification-row-extra">{notificationItem.extraFindingLine}</p>
                          ) : null}
                        </div>
                      </article>
                    ))}

                    <div className="notifications-load-more-wrap">
                      {isLoadingOlderNotifications ? (
                        <div className="notifications-load-spinner" role="status" aria-label="Loading older notifications">
                          <span className="notifications-load-spinner-icon" aria-hidden="true" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="notifications-load-more-btn"
                          onClick={() => {
                            if (isLoadingOlderNotifications) {
                              return
                            }

                            setIsLoadingOlderNotifications(true)

                            if (loadOlderNotificationsTimeoutRef.current !== null) {
                              window.clearTimeout(loadOlderNotificationsTimeoutRef.current)
                            }

                            loadOlderNotificationsTimeoutRef.current = window.setTimeout(() => {
                              setIsLoadingOlderNotifications(false)
                              loadOlderNotificationsTimeoutRef.current = null
                            }, 1100)
                          }}
                        >
                          Load older notifications
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div
              className={`global-profile-menu ${isProfileDrawerOpen ? 'is-open' : ''}`}
              ref={profileDrawerRef}
            >
              <button
                type="button"
                className="global-avatar-btn"
                aria-label="User profile"
                aria-expanded={isProfileDrawerOpen}
                aria-controls="profile-drawer"
                onClick={() => {
                  setIsLayoutDrawerOpen(false)
                  setIsStateDrawerOpen(false)
                  setIsNotificationDrawerOpen(false)
                  setIsProfileDrawerOpen((current) => !current)
                }}
              >
                IN
              </button>

              {isProfileDrawerOpen ? (
                <div id="profile-drawer" className="profile-drawer" role="dialog" aria-label="User profile menu">
                  <div className="profile-drawer-header">
                    <div className="profile-drawer-identity">
                      <span className="profile-drawer-avatar" aria-hidden="true">IN</span>
                      <div className="profile-drawer-copy">
                        <p className="profile-drawer-inst">Institution name</p>
                        <p className="profile-drawer-user">User name</p>
                      </div>
                    </div>

                    <button type="button" className="profile-drawer-refresh-btn material-symbols-outlined" aria-label="Refresh user context">
                      refresh
                    </button>
                  </div>

                  <div className="profile-drawer-divider" />

                  <nav className="profile-drawer-nav" aria-label="Profile actions">
                    {PROFILE_MENU_ITEMS.map((menuItem) => (
                      <button type="button" key={menuItem} className="profile-drawer-link">
                        {menuItem}
                      </button>
                    ))}
                  </nav>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="worklist-screen">
          <div className="worklist-toolbar">
            <div className="worklist-tabs" role="tablist" aria-label="Worklist views">
              {WORKLIST_TABS.map((tabLabel) => (
                <button
                  key={tabLabel}
                  type="button"
                  role="tab"
                  aria-selected={activeWorklistTab === tabLabel}
                  className={`worklist-tab ${activeWorklistTab === tabLabel ? 'is-active' : ''}`}
                  onClick={() => setActiveWorklistTab(tabLabel)}
                >
                  {tabLabel}
                </button>
              ))}
            </div>

            <label className="worklist-search">
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input
                ref={worklistSearchInputRef}
                type="text"
                placeholder="Search"
                aria-label="Search worklist"
                value={worklistSearch}
                onChange={(event) => setWorklistSearch(event.target.value)}
              />
              <button
                type="button"
                className="worklist-search-clear material-symbols-outlined"
                aria-label="Clear search"
                onClick={() => {
                  setWorklistSearch('')
                  worklistSearchInputRef.current?.focus()
                }}
              >
                close
              </button>
            </label>

            <div className={`worklist-menu ${isWorklistMenuOpen ? 'is-open' : ''}`} ref={worklistMenuRef}>
              <button
                type="button"
                className="worklist-menu-btn material-symbols-outlined"
                aria-label="More options"
                aria-expanded={isWorklistMenuOpen}
                aria-controls="worklist-menu-drawer"
                onClick={() => {
                  setIsLayoutDrawerOpen(false)
                  setIsStateDrawerOpen(false)
                  setIsNotificationDrawerOpen(false)
                  setIsProfileDrawerOpen(false)
                  setIsWorklistMenuOpen((current) => !current)
                }}
              >
                more_vert
              </button>

              {isWorklistMenuOpen ? (
                <div id="worklist-menu-drawer" className="worklist-menu-drawer" role="dialog" aria-label="Worklist actions">
                  <button type="button" className="layout-drawer-row layout-drawer-row-option">
                    Create custom view
                  </button>
                  <button type="button" className="layout-drawer-row layout-drawer-row-option">
                    Save current filter
                  </button>
                  <button type="button" className="layout-drawer-row layout-drawer-row-option">
                    Export worklist
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="worklist-table" role="table" aria-label="Patient worklist">
            <div className="worklist-row worklist-row-header" role="row">
              <span className="worklist-cell" role="columnheader">Patient name</span>
              <span className="worklist-cell" role="columnheader">DOB</span>
              <span className="worklist-cell" role="columnheader">Sex</span>
              <span className="worklist-cell" role="columnheader">Age</span>
              <span className="worklist-cell" role="columnheader">PID</span>
              <span className="worklist-cell" role="columnheader">Results preview</span>
              <span className="worklist-cell" role="columnheader">Protocol (Study descr...)</span>
              <span className="worklist-cell" role="columnheader">Findings</span>
              <span className="worklist-cell" role="columnheader">State</span>
            </div>

            {WORKLIST_ROWS.map((row) => {
              const liesInCase2 = row.patientName === 'April Ludgate' || row.patientName === 'Ben Wyatt'
              const isProcessing = row.state === 'processing'
              const linkedCaseId: CaseTabId = liesInCase2 ? 'case-2' : 'case-1'

              const openRow = () => {
                if (isProcessing) {
                  return
                }
                openCaseTab(linkedCaseId)
              }

              const isOpenedCase = row.state === 'opened' && openCaseTabIds.includes(linkedCaseId)

              const findingCount = row.markers.reduce((sum, marker) => sum + marker.value, 0)

              return (
                <div
                  key={row.id}
                  className={`worklist-row ${isProcessing ? 'is-processing' : ''} ${
                    isOpenedCase ? 'is-selected-case' : ''
                  }`}
                  role="row"
                  tabIndex={isProcessing ? -1 : 0}
                  aria-disabled={isProcessing}
                  onClick={openRow}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openRow()
                    }
                  }}
                >
                  <span className="worklist-cell worklist-cell-name" role="cell">{row.patientName}</span>
                  <span className="worklist-cell" role="cell">{row.dob}</span>
                  <span className="worklist-cell" role="cell">{row.sex}</span>
                  <span className="worklist-cell" role="cell">{row.age}</span>
                  <span className="worklist-cell worklist-cell-pid" role="cell">{row.pid}</span>
                  <span className="worklist-cell worklist-cell-preview" role="cell">{row.resultsPreview}</span>
                  <span className="worklist-cell" role="cell">{row.protocol}</span>
                  <span className="worklist-cell worklist-cell-markers" role="cell">
                    {isProcessing ? (
                      <span className="worklist-marker-spinner" aria-label="Processing" />
                    ) : (
                      <span className="worklist-findings-count">{findingCount}</span>
                    )}
                  </span>
                  <span className="worklist-cell" role="cell">
                    {row.state === 'processing' ? (
                      <span className="worklist-state-spinner" aria-label="Processing" />
                    ) : (
                      <span className={`worklist-state-pill worklist-state-${row.state}`}>
                        {WORKLIST_STATE_LABELS[row.state]}
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </main>
        {findingInfoModal}
      </div>
    )
  }

  const findingInfoModal = activeFindingInfoModal ? (
    <div
      className="finding-info-modal-overlay"
      role="presentation"
      onClick={closeFindingInfoModal}
    >
      <section
        className="finding-info-modal"
        role="dialog"
        aria-label="Additional finding information"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="finding-info-modal-header">
          <h3>{`Additional info - ${activeFindingInfoModal.findingName}`}</h3>
          <button
            type="button"
            className="finding-info-modal-close material-symbols-outlined"
            aria-label="Close additional finding information"
            onClick={closeFindingInfoModal}
          >
            close
          </button>
        </header>

        <div className="finding-info-modal-body">
          <section className="finding-info-block">
            <h4>Data source</h4>
            <p>{'{source_name}, {version_64chars_max}'}</p>
          </section>

          <section className="finding-info-block">
            <h4>Confidence (1-low to 10-high)</h4>
            <p className="finding-info-confidence">10</p>
          </section>

          <section className="finding-info-block">
            <h4>Template</h4>
            <p>{'{template_name}'}</p>
          </section>

          <section className="finding-info-block">
            <h4>Explanation</h4>
            <p>
              Detected View Position: PA. AI results are auto generated and can be incomplete or
              incorrect. Assess original images for any decision. AI Confidence score should be
              always interpreted as the non-diagnostic likelihood of the findings.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p>
          </section>
        </div>

        <footer className="finding-info-modal-footer">
          <button type="button" className="finding-info-modal-footer-close" onClick={closeFindingInfoModal}>
            Close
          </button>
        </footer>
      </section>
    </div>
  ) : null

  if (activeGlobalTab === 'quick') {
    return renderQuickSearchScreen()
  }

  if (isDedicatedViewerOpen) {
    return (
      <div className="app-shell dedicated-viewer-mode">
        <header className="global-topbar" aria-label="Workspace tabs and actions">
          <div className="global-topbar-tabs">
            <button
              type="button"
              className="global-tab global-tab-icon-only"
              aria-label="Open quick tab"
              onClick={() => setActiveGlobalTab('quick')}
            >
              <span className="global-tab-person material-symbols-outlined" aria-hidden="true">
                search
              </span>
            </button>

            {CASE_TABS.filter((tab) => openCaseTabIds.includes(tab.id)).map((tab) => (
              <div key={tab.id} className="global-tab-shell">
                <button
                  type="button"
                  className={`global-tab ${activeGlobalTab === tab.id ? 'is-active' : ''}`}
                  aria-label={`Open ${tab.name}`}
                  onClick={() => setActiveGlobalTab(tab.id)}
                >
                  <span className="global-tab-person material-symbols-outlined" aria-hidden="true">
                    man
                  </span>
                  <span className="global-tab-copy">
                    <span className="global-tab-title">{tab.name}</span>
                    <span className="global-tab-meta">{tab.meta}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="global-tab-close material-symbols-outlined"
                  aria-label={`Close ${tab.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    closeCaseTab(tab.id)
                  }}
                >
                  close
                </button>
              </div>
            ))}
          </div>

          <div className="global-topbar-actions">
            <button type="button" className="global-chip" aria-label="Select layout">
              <span>{`Layout: ${activeLayoutPreset}`}</span>
              <span className="global-chip-caret material-symbols-outlined" aria-hidden="true">
                expand_more
              </span>
            </button>

            <button type="button" className="global-chip global-chip-accent" aria-label="Select state">
              <span>{`State: ${
                STATE_OPTIONS.find((stateOption) => stateOption.id === activeStateOptionId)?.label ?? 'Opened'
              }`}</span>
              <span className="global-chip-caret material-symbols-outlined" aria-hidden="true">
                expand_more
              </span>
            </button>

            <button type="button" className="global-icon-btn material-symbols-outlined" aria-label="Refresh workspace">
              refresh
            </button>
            <button type="button" className="global-icon-btn material-symbols-outlined" aria-label="Notifications">
              notifications
            </button>
            <button type="button" className="global-avatar-btn" aria-label="User profile">
              IN
            </button>
          </div>
        </header>

        <main
          className="workspace-shell"
          ref={containerRef}
          style={
            {
              '--left-width': `${sectionWidths[0]}%`,
              '--center-width': `${sectionWidths[1]}%`,
              '--right-width': `${sectionWidths[2]}%`,
            } as CSSProperties
          }
        >
          <section className="panel panel-left" aria-label="Image list">
            <header className="panel-header review-images-header">
              <div className="review-left-tab-switcher" role="tablist" aria-label="Dedicated left section views">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeDedicatedLeftTab === 'overview'}
                  className={`review-left-tab ${activeDedicatedLeftTab === 'overview' ? 'is-active' : ''}`}
                  onClick={() => setActiveDedicatedLeftTab('overview')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeDedicatedLeftTab === 'images'}
                  className={`review-left-tab ${activeDedicatedLeftTab === 'images' ? 'is-active' : ''}`}
                  onClick={() => setActiveDedicatedLeftTab('images')}
                >
                  {`Images (${THUMBNAILS.length})`}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeDedicatedLeftTab === 'results'}
                  className={`review-left-tab ${activeDedicatedLeftTab === 'results' ? 'is-active' : ''}`}
                  onClick={() => setActiveDedicatedLeftTab('results')}
                >
                  Results
                </button>
              </div>
            </header>

            {activeDedicatedLeftTab === 'overview' ? (
              <div className="review-left-overview-pane">
                <div className="study-tree">
                  <div className={`study-selector ${isStudyPickerOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="study-selector-home"
                      onClick={() => {
                        setIsStudyPickerOpen(false)
                        closeViewer('ct-main')
                      }}
                      aria-label="Return to studies overview"
                    >
                      <span className="tree-folder-icon material-symbols-outlined" aria-hidden="true">
                        folder
                      </span>
                      <span className="study-selector-title">Patient data</span>
                    </button>

                    <div className="study-selector-dropdown" ref={studyPickerRef}>
                      <button
                        type="button"
                        className={`study-selector-trigger ${isStudyPickerOpen ? 'is-open' : ''}`}
                        onClick={() => setIsStudyPickerOpen((current) => !current)}
                        aria-expanded={isStudyPickerOpen}
                        aria-label="Select CT studies"
                      >
                        <span className="study-selector-current">
                          {selectedStudyCount} {selectedStudyCount === 1 ? 'study' : 'studies'}
                        </span>
                        <span className={`study-selector-chevron material-symbols-outlined ${isStudyPickerOpen ? 'is-open' : ''}`} aria-hidden="true">
                          expand_more
                        </span>
                      </button>

                      {isStudyPickerOpen ? (
                        <div className="study-picker" role="dialog" aria-label="CT study picker">
                          {(['Current', 'Prior'] as const).map((group) => (
                            <div key={group} className="study-picker-group">
                              <p className="study-picker-label">{group}</p>
                              <ul className="study-picker-list">
                                {STUDY_OPTIONS.filter((option) => option.group === group).map((option) => {
                                  const isChecked = selectedStudyIds.includes(option.id)

                                  return (
                                    <li key={option.id}>
                                      <button
                                        type="button"
                                        className="study-picker-option"
                                        onClick={() => toggleStudySelection(option.id)}
                                      >
                                        <span className={`study-picker-box ${isChecked ? 'is-checked' : ''}`} aria-hidden="true">
                                          {isChecked ? (
                                            <span className="material-symbols-outlined study-picker-check-icon">check</span>
                                          ) : null}
                                        </span>
                                        <span>{option.label}</span>
                                      </button>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="study-tree-body">{renderTree(visibleTreeNodes)}</div>
                </div>

                {renderFindingMap()}
              </div>
            ) : null}

            {activeDedicatedLeftTab === 'images' ? (
              <div className="review-image-list">
                {THUMBNAILS.map((thumbnail) => (
                  <button
                    type="button"
                    key={thumbnail.id}
                    className={`thumb-card review-image-card ${activeThumbnail.id === thumbnail.id ? 'is-active' : ''}`}
                    ref={(element) => {
                      reviewImageCardRefs.current[thumbnail.id] = element
                    }}
                    onClick={() => selectDedicatedThumbnail(thumbnail.id)}
                  >
                    <div className={`thumb-image ${thumbnail.id}`} style={getThumbnailImageStyle(thumbnail.id)} />
                    <p>{thumbnail.label}</p>
                  </button>
                ))}
              </div>
            ) : null}

            {activeDedicatedLeftTab === 'results' ? (
              <div className="review-left-results-pane">
                <ul className="findings-list">
                  {FINDINGS.map((finding) => {
                    const isTreeMetricActive = selectedTreeRowId === finding.nodeId
                    const isDeleted = deletedFindingIds.includes(finding.id)

                    return (
                      <li key={finding.id}>
                        <article
                          className={`result-card ${activeFinding.id === finding.id && isViewerOpen ? 'is-selected' : ''} ${
                            isDeleted ? 'is-deleted' : ''
                          }`}
                          role={isDeleted ? undefined : 'button'}
                          tabIndex={isDeleted ? -1 : 0}
                          ref={(element) => {
                            resultCardRefs.current[finding.id] = element
                          }}
                          onPointerDown={isDeleted ? undefined : handleResultCardPointerDown}
                          onPointerUp={isDeleted ? undefined : () => handleResultCardPointerUp(finding.id, finding.nodeId)}
                          onClick={isDeleted ? undefined : handleResultCardClick}
                          onKeyDown={(event) => {
                            if (isDeleted) {
                              return
                            }

                            if (event.key !== 'Enter' && event.key !== ' ') {
                              return
                            }

                            event.preventDefault()
                            activateFindingCard(finding.id, finding.nodeId)
                          }}
                        >
                          {isDeleted ? (
                            <>
                              <div className="result-card-deleted-row">
                                <p className="result-card-deleted-title">
                                  Deleted: <span>{finding.title}</span>
                                </p>
                              </div>

                              <div className="result-card-actions result-card-deleted-actions" aria-hidden="true">
                                <button
                                  type="button"
                                  className="result-card-action-btn result-card-undo-btn material-symbols-outlined"
                                  tabIndex={-1}
                                  aria-label={`Restore ${finding.title}`}
                                  onMouseDown={stopActionEvent}
                                  onPointerDown={stopActionEvent}
                                  onPointerUp={stopActionEvent}
                                  onClick={(event) => {
                                    stopActionEvent(event)
                                    restoreFinding(finding.id)
                                  }}
                                >
                                  undo
                                </button>
                              </div>

                              <button
                                type="button"
                                className="result-card-menu-btn material-symbols-outlined"
                                aria-label={`More actions for deleted ${finding.title}`}
                                onMouseDown={stopActionEvent}
                                onPointerDown={stopActionEvent}
                                onPointerUp={stopActionEvent}
                                onClick={stopActionEvent}
                              >
                                more_vert
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="result-card-menu-btn material-symbols-outlined"
                                aria-label={`More actions for ${finding.title}`}
                                onMouseDown={stopActionEvent}
                                onPointerDown={stopActionEvent}
                                onPointerUp={stopActionEvent}
                                onClick={stopActionEvent}
                              >
                                more_vert
                              </button>

                              <div className="result-card-actions" aria-hidden="true">
                                <button
                                  type="button"
                                  className="result-card-action-btn material-symbols-outlined"
                                  tabIndex={-1}
                                  aria-label="Finding info"
                                  onMouseDown={stopActionEvent}
                                  onPointerDown={stopActionEvent}
                                  onPointerUp={stopActionEvent}
                                  onClick={(event) => {
                                    stopActionEvent(event)
                                    openFindingInfoModal(finding.title)
                                  }}
                                >
                                  info
                                </button>
                                <button
                                  type="button"
                                  className="result-card-action-btn material-symbols-outlined"
                                  tabIndex={-1}
                                  aria-label="Open in viewer"
                                  onMouseDown={stopActionEvent}
                                  onPointerDown={stopActionEvent}
                                  onPointerUp={stopActionEvent}
                                  onClick={(event) => {
                                    stopActionEvent(event)
                                    const relatedThumbnail = THUMBNAILS.find(
                                      (thumbnail) => thumbnail.findingId === finding.id,
                                    )
                                    openDedicatedViewerFromSource(
                                      'results',
                                      finding.id,
                                      finding.nodeId,
                                      relatedThumbnail?.id,
                                    )
                                  }}
                                >
                                  open_in_new
                                </button>
                                <button
                                  type="button"
                                  className="result-card-action-btn material-symbols-outlined"
                                  tabIndex={-1}
                                  aria-label="Delete finding"
                                  onMouseDown={stopActionEvent}
                                  onPointerDown={stopActionEvent}
                                  onPointerUp={stopActionEvent}
                                  onClick={(event) => {
                                    stopActionEvent(event)
                                    deleteFinding(finding.id)
                                  }}
                                >
                                  delete
                                </button>
                              </div>

                              <h3>{finding.title}</h3>
                              <p>{finding.summary}</p>
                              <p className={`result-metric ${isTreeMetricActive ? 'is-active' : ''}`}>
                                <span className="result-metric-value">{finding.metric}</span>
                              </p>
                              {showResultThumbnails ? (
                                <div className="result-thumbs">
                                  {THUMBNAILS.filter((thumbnail) => thumbnail.findingId === finding.id).map(
                                    (thumbnail) => (
                                      <button
                                        type="button"
                                        key={`${finding.id}-${thumbnail.id}`}
                                        className={`result-thumb-item ${
                                          activeThumbnail.id === thumbnail.id && isViewerOpen ? 'is-active' : ''
                                        }`}
                                        onPointerDown={(event) => {
                                          event.stopPropagation()
                                        }}
                                        onPointerUp={(event) => {
                                          event.stopPropagation()
                                        }}
                                        onClick={(event) => {
                                          event.stopPropagation()

                                          if (activeThumbnail.id === thumbnail.id && isViewerOpen) {
                                            closeViewer()
                                            return
                                          }

                                          openViewer(finding.id, finding.nodeId, thumbnail.id)
                                        }}
                                        aria-label={`Open ${finding.title} image ${thumbnail.label}`}
                                      >
                                        <span className={`thumb-image ${thumbnail.id}`} style={getThumbnailImageStyle(thumbnail.id)} />
                                      </button>
                                    ),
                                  )}
                                </div>
                              ) : null}
                            </>
                          )}
                        </article>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
          </section>

          <button
            type="button"
            className="drag-divider"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize left and middle sections"
            aria-valuenow={Math.round(sectionWidths[0])}
            onPointerDown={(event) => handleDividerPointerDown(0, event)}
            onKeyDown={(event) => handleDividerKeyDown(0, event)}
          >
            <span />
          </button>

          <section className="panel panel-center viewer-open" aria-label="Dedicated viewer stage">
            <header className="panel-header panel-header-viewer">
              <button
                type="button"
                className="ghost-btn icon-btn material-symbols-outlined"
                aria-label={`Exit {viewer_name}`}
                onClick={closeDedicatedViewer}
              >
                close
              </button>

              <h2>
                {`Review/edit: ${activeFinding.title} (${activeFindingThumbnails.length === 0 ? 0 : activeThumbnailIndex + 1}/${activeFindingThumbnails.length})`}
              </h2>

              <div className="panel-header-actions">
                <button
                  type="button"
                  className="ghost-btn icon-btn viewer-nav-btn material-symbols-outlined"
                  aria-label="Previous image"
                  onClick={() => selectViewerThumbnail(-1)}
                >
                  chevron_left
                </button>
                <button
                  type="button"
                  className="ghost-btn icon-btn viewer-nav-btn material-symbols-outlined"
                  aria-label="Next image"
                  onClick={() => selectViewerThumbnail(1)}
                >
                  chevron_right
                </button>
              </div>
            </header>

            <section className="viewer-screen" aria-label="Focused image viewer">
              <div className="dedicated-viewer-toolbar" aria-label="Viewer action bar">
                <div className="dedicated-viewer-toolbar-group dedicated-viewer-toolbar-group-tools">
                  <button type="button" className="dedicated-viewer-toolbar-icon material-symbols-outlined" aria-label="Detection tools">
                    assignment
                  </button>
                  <button type="button" className="dedicated-viewer-toolbar-icon material-symbols-outlined" aria-label="Notifications">
                    notifications
                  </button>
                  <button type="button" className="dedicated-viewer-toolbar-icon material-symbols-outlined" aria-label="Collaboration">
                    groups
                  </button>
                  <button type="button" className="dedicated-viewer-toolbar-icon material-symbols-outlined" aria-label="Help">
                    help
                  </button>
                  <button type="button" className="dedicated-viewer-toolbar-icon material-symbols-outlined" aria-label="Settings">
                    settings
                  </button>
                </div>

                <div className="dedicated-viewer-toolbar-group dedicated-viewer-layout-group" role="group" aria-label="Layout presets">
                  <div className="dedicated-viewer-layout-options" aria-label="Layout button options">
                    {DEDICATED_LAYOUT_OPTIONS.map((layoutOption) => (
                      <button
                        key={layoutOption}
                        type="button"
                        className={`dedicated-viewer-layout-btn ${
                          activeDedicatedLayout === layoutOption ? 'is-active' : ''
                        }`}
                        onClick={() => setActiveDedicatedLayout(layoutOption)}
                      >
                        <span className="dedicated-viewer-layout-dot" aria-hidden="true" />
                        <span>{layoutOption}</span>
                      </button>
                    ))}
                  </div>

                  <div className="dedicated-viewer-layout-compact">
                    <span
                      className="material-symbols-outlined dedicated-viewer-layout-compact-icon"
                      aria-hidden="true"
                    >
                      auto_awesome_mosaic
                    </span>
                    <select
                      className="dedicated-viewer-layout-select"
                      value={activeDedicatedLayout}
                      onChange={(event) =>
                        setActiveDedicatedLayout(event.target.value as DedicatedLayoutOption)
                      }
                      aria-label="Layout presets"
                    >
                      {DEDICATED_LAYOUT_OPTIONS.map((layoutOption) => (
                        <option key={layoutOption} value={layoutOption}>
                          {layoutOption}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="dedicated-viewer-toolbar-divider" aria-hidden="true" />

                <div className="dedicated-viewer-toolbar-group dedicated-viewer-toolbar-group-actions">
                  <button type="button" className="dedicated-viewer-toolbar-icon material-symbols-outlined" aria-label="Discard">
                    delete
                  </button>
                  <button type="button" className="dedicated-viewer-toolbar-icon material-symbols-outlined" aria-label="Pause">
                    pause
                  </button>
                  <button type="button" className="dedicated-viewer-save-btn" aria-label="Save and send">
                    <span className="material-symbols-outlined" aria-hidden="true">check</span>
                    <span>Save &amp; Send</span>
                  </button>
                </div>
              </div>

              <div
                className={`viewer-stage viewer-${activeThumbnail.id}`}
                style={
                  {
                    '--viewer-scale': viewerTransform.scale,
                    '--viewer-pan-x': `${viewerTransform.panX}px`,
                    '--viewer-pan-y': `${viewerTransform.panY}px`,
                    '--dot-inverse-scale': `${1 / viewerTransform.scale}`,
                    '--viewer-square-size': viewerSquareSize ? `${viewerSquareSize}px` : undefined,
                  } as CSSProperties
                }
                onWheel={handleViewerWheel}
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    deselectDedicatedFinding(activeThumbnail.id)
                  }
                }}
              >
                <div
                  className={`viewer-frame viewer-${activeThumbnail.id}`}
                  ref={viewerFrameRef}
                  onPointerDown={handleViewerPointerDown}
                  onPointerMove={handleViewerPointerMove}
                  onPointerUp={finishViewerPan}
                  onPointerLeave={finishViewerPan}
                  onPointerCancel={finishViewerPan}
                  onClick={() => {
                    deselectDedicatedFinding(activeThumbnail.id)
                  }}
                />

                <div className="review-finding-dots-layer" aria-label="Image findings markers">
                  {activeDedicatedFindings.map((finding) => {
                    const statusKey = `${activeThumbnail.id}::${finding.id}`
                    const isDeleted = Boolean(deletedDedicatedFindings[statusKey])
                    const isAccepted = reviewFindingStatuses[statusKey] === 'accepted'

                    if (isDeleted) {
                      return null
                    }

                    const isSelected = selectedDedicatedFindingId === finding.id
                    const isHovered = hoveredDedicatedFindingId === finding.id

                    return (
                      <button
                        key={finding.id}
                        type="button"
                        className={`review-finding-dot-btn ${isSelected ? 'is-selected' : ''} ${
                          isHovered ? 'is-hovered' : ''
                        } ${isAccepted ? 'is-accepted' : 'is-unaccepted'}`}
                        style={{ top: finding.top, left: finding.left }}
                        aria-label={`Select ${finding.label}`}
                        title="*AI"
                        onMouseEnter={() => {
                          setHoveredDedicatedFindingByThumbnail((current) => ({
                            ...current,
                            [activeThumbnail.id]: finding.id,
                          }))
                        }}
                        onMouseLeave={() => {
                          setHoveredDedicatedFindingByThumbnail((current) => ({
                            ...current,
                            [activeThumbnail.id]: undefined,
                          }))
                        }}
                        onFocus={() => {
                          setHoveredDedicatedFindingByThumbnail((current) => ({
                            ...current,
                            [activeThumbnail.id]: finding.id,
                          }))
                        }}
                        onBlur={() => {
                          setHoveredDedicatedFindingByThumbnail((current) => ({
                            ...current,
                            [activeThumbnail.id]: undefined,
                          }))
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          selectDedicatedFinding(activeThumbnail.id, finding.id)
                        }}
                      >
                        <span
                          className={`review-finding-dot-label ${
                            Number.parseFloat(finding.left) > 58 ? 'is-left' : 'is-right'
                          }`}
                          aria-hidden="true"
                        >
                          {`${finding.label} *AI`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>
          </section>

          <button
            type="button"
            className="drag-divider"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize middle and right sections"
            aria-valuenow={Math.round(sectionWidths[1])}
            onPointerDown={(event) => handleDividerPointerDown(1, event)}
            onKeyDown={(event) => handleDividerKeyDown(1, event)}
          >
            <span />
          </button>

          <section
            className="panel panel-right"
            aria-label="Dedicated findings"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                deselectDedicatedFinding(activeThumbnail.id)
              }
            }}
          >
            <header className="panel-header">
              <h2>Findings ({activeDedicatedFindings.length})</h2>

              <div className="panel-header-actions review-header-bulk-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => acceptAllDedicatedFindings(activeThumbnail.id, activeDedicatedFindings)}
                >
                  Accept all
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => rejectAllDedicatedFindings(activeThumbnail.id, activeDedicatedFindings)}
                >
                  Reject all
                </button>
              </div>
            </header>

            <ul
              className="findings-list review-findings-list"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  deselectDedicatedFinding(activeThumbnail.id)
                }
              }}
            >
              {activeDedicatedFindings.map((finding, index) => {
                const isSelected = selectedDedicatedFindingId === finding.id
                const isHovered = hoveredDedicatedFindingId === finding.id
                const statusKey = `${activeThumbnail.id}::${finding.id}`
                const reviewStatus = reviewFindingStatuses[statusKey]
                const isAccepted = reviewStatus === 'accepted'
                const isRejected = reviewStatus === 'rejected'
                const isUnreviewed = reviewStatus === undefined
                const isDeleted = Boolean(deletedDedicatedFindings[statusKey])
                const findingTitle = finding.label.replace(/^\[L\d+\]\s*/, '')
                const showAiSuffix = isUnreviewed
                const findingTitleStateClass = isAccepted
                  ? 'is-accepted'
                  : isRejected
                    ? 'is-rejected'
                    : 'is-unreviewed'

                return (
                  <li key={finding.id}>
                    <article
                      className={`result-card ${isSelected ? 'is-selected' : ''} ${
                        isHovered ? 'is-hovered' : ''
                      } ${
                        isRejected ? 'is-rejected' : ''
                      } ${
                        isDeleted ? 'is-deleted' : ''
                      }`}
                      role={isDeleted ? undefined : 'button'}
                      tabIndex={isDeleted ? -1 : 0}
                      onClick={
                        isDeleted
                          ? undefined
                          : () => {
                              if (isSelected) {
                                deselectDedicatedFinding(activeThumbnail.id)
                                return
                              }

                              selectDedicatedFinding(activeThumbnail.id, finding.id)
                            }
                      }
                      onMouseEnter={() => {
                        setHoveredDedicatedFindingByThumbnail((current) => ({
                          ...current,
                          [activeThumbnail.id]: finding.id,
                        }))
                      }}
                      onMouseLeave={() => {
                        setHoveredDedicatedFindingByThumbnail((current) => ({
                          ...current,
                          [activeThumbnail.id]: undefined,
                        }))
                      }}
                      onKeyDown={(event) => {
                        if (isDeleted) {
                          return
                        }

                        if (event.key !== 'Enter' && event.key !== ' ') {
                          return
                        }

                        event.preventDefault()
                        selectDedicatedFinding(activeThumbnail.id, finding.id)
                      }}
                    >
                      {isDeleted ? (
                        <>
                          <div className="result-card-deleted-row review-deleted-row">
                            <div className="review-finding-main">
                              <span className="review-finding-index" aria-hidden="true">{`[L${index + 1}]`}</span>
                              <p className="review-deleted-title">
                                Deleted: <span>{findingTitle}</span>
                              </p>
                            </div>
                          </div>

                          <div className="result-card-actions result-card-deleted-actions" aria-hidden="true">
                            <button
                              type="button"
                              className="result-card-action-btn result-card-undo-btn material-symbols-outlined"
                              tabIndex={-1}
                              aria-label={`Restore ${finding.label}`}
                              onMouseDown={stopActionEvent}
                              onPointerDown={stopActionEvent}
                              onPointerUp={stopActionEvent}
                              onClick={(event) => {
                                stopActionEvent(event)
                                restoreDedicatedFinding(activeThumbnail.id, finding.id)
                              }}
                            >
                              undo
                            </button>
                          </div>

                          <button
                            type="button"
                            className="result-card-menu-btn material-symbols-outlined"
                            aria-label={`More actions for deleted ${finding.label}`}
                            onMouseDown={stopActionEvent}
                            onPointerDown={stopActionEvent}
                            onPointerUp={stopActionEvent}
                            onClick={stopActionEvent}
                          >
                            more_vert
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="result-card-action-btn result-card-info-btn material-symbols-outlined"
                            aria-label={`Finding info for ${finding.label}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              openFindingInfoModal(finding.label)
                            }}
                          >
                            info
                          </button>

                          <button
                            type="button"
                            className="result-card-menu-btn material-symbols-outlined"
                            aria-label={`More actions for ${finding.label}`}
                            onMouseDown={stopActionEvent}
                            onPointerDown={stopActionEvent}
                            onPointerUp={stopActionEvent}
                            onClick={stopActionEvent}
                          >
                            more_vert
                          </button>

                          {reviewStatus !== 'accepted' ? (
                            <div className="result-card-actions" aria-hidden="true">
                              <button
                                type="button"
                                className="result-card-action-btn material-symbols-outlined"
                                tabIndex={-1}
                                aria-label={`Accept ${finding.label}`}
                                onMouseDown={stopActionEvent}
                                onPointerDown={stopActionEvent}
                                onPointerUp={stopActionEvent}
                                onClick={(event) => {
                                  stopActionEvent(event)
                                  setReviewFindingStatus(activeThumbnail.id, finding.id, 'accepted')
                                }}
                              >
                                check
                              </button>
                              <button
                                type="button"
                                className={`result-card-action-btn material-symbols-outlined ${
                                  reviewStatus === 'rejected' ? 'is-active' : ''
                                }`}
                                tabIndex={-1}
                                aria-label={`Reject ${finding.label}`}
                                onMouseDown={stopActionEvent}
                                onPointerDown={stopActionEvent}
                                onPointerUp={stopActionEvent}
                                onClick={(event) => {
                                  stopActionEvent(event)
                                  setReviewFindingStatus(activeThumbnail.id, finding.id, 'rejected')
                                  deleteDedicatedFinding(activeThumbnail.id, finding.id)
                                }}
                              >
                                delete
                              </button>
                            </div>
                          ) : null}

                          <div className="review-finding-main">
                            <span className="review-finding-index" aria-hidden="true">{`[L${index + 1}]`}</span>
                            <div className="review-finding-copy">
                              <h3 className={findingTitleStateClass}>
                                {findingTitle}
                                {showAiSuffix ? (
                                  <span className="review-finding-ai-suffix"> - *AI finding</span>
                                ) : isAccepted ? (
                                  <span> - Accepted</span>
                                ) : null}
                              </h3>
                              <p>{finding.description}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </article>
                  </li>
                )
              })}
            </ul>
          </section>
        </main>
        {findingInfoModal}
      </div>
    )
  }

  return (
    <div className={`app-shell ${isViewerFullscreen ? 'is-viewer-local-fullscreen' : ''}`}>
      <header className="global-topbar" aria-label="Workspace tabs and actions">
        <div className="global-topbar-tabs">
          <button
            type="button"
            className="global-tab global-tab-icon-only"
            aria-label="Open quick tab"
            onClick={() => setActiveGlobalTab('quick')}
          >
            <span className="global-tab-person material-symbols-outlined" aria-hidden="true">
              search
            </span>
          </button>

          {CASE_TABS.filter((tab) => openCaseTabIds.includes(tab.id)).map((tab) => (
            <div key={tab.id} className="global-tab-shell">
              <button
                type="button"
                className={`global-tab ${activeGlobalTab === tab.id ? 'is-active' : ''}`}
                aria-label={`Open ${tab.name}`}
                onClick={() => setActiveGlobalTab(tab.id)}
              >
                <span className="global-tab-person material-symbols-outlined" aria-hidden="true">
                  man
                </span>
                <span className="global-tab-copy">
                  <span className="global-tab-title">{tab.name}</span>
                  <span className="global-tab-meta">{tab.meta}</span>
                </span>
              </button>
              <button
                type="button"
                className="global-tab-close material-symbols-outlined"
                aria-label={`Close ${tab.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  closeCaseTab(tab.id)
                }}
              >
                close
              </button>
            </div>
          ))}
        </div>

        <div className="global-topbar-actions">
          <div
            className={`global-layout-menu ${isLayoutDrawerOpen ? 'is-open' : ''}`}
            ref={layoutDrawerRef}
          >
            <button
              type="button"
              className="global-chip"
              aria-label="Select layout"
              aria-expanded={isLayoutDrawerOpen}
              aria-controls="layout-drawer"
              onClick={() => {
                setIsStateDrawerOpen(false)
                setIsNotificationDrawerOpen(false)
                setIsProfileDrawerOpen(false)
                setIsLayoutDrawerOpen((current) => !current)
              }}
            >
              <span>{`Layout: ${activeLayoutPreset}`}</span>
              <span className="global-chip-caret material-symbols-outlined" aria-hidden="true">
                expand_more
              </span>
            </button>

            {isLayoutDrawerOpen ? (
              <div id="layout-drawer" className="layout-drawer" role="dialog" aria-label="Select layout preset">
                <button
                  type="button"
                  className="layout-drawer-row layout-drawer-row-check"
                  onClick={() => setIsLayoutAutoDetect((current) => !current)}
                >
                  <span className={`layout-check ${isLayoutAutoDetect ? 'is-checked' : ''}`} aria-hidden="true">
                    {isLayoutAutoDetect ? (
                      <span className="material-symbols-outlined layout-check-icon">check</span>
                    ) : null}
                  </span>
                  <span>Auto-detect (by DICOM tags)</span>
                </button>

                <div className="layout-drawer-divider" />

                <div className="layout-drawer-list" role="listbox" aria-label="Layout presets">
                  {LAYOUT_PRESETS.map((layoutPreset) => {
                    const isSelected = activeLayoutPreset === layoutPreset
                    return (
                      <button
                        type="button"
                        key={layoutPreset}
                        className="layout-drawer-row layout-drawer-row-option"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => selectLayoutPreset(layoutPreset as LayoutPreset)}
                      >
                        <span className={`layout-radio ${isSelected ? 'is-selected' : ''}`} aria-hidden="true" />
                        <span>{layoutPreset}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div
            className={`global-state-menu ${isStateDrawerOpen ? 'is-open' : ''}`}
            ref={stateDrawerRef}
          >
            <button
              type="button"
              className={`global-chip global-chip-accent ${
                activeStateOptionId === 'resolved' ? 'is-resolved-state' : ''
              }`}
              aria-label="Select state"
              aria-expanded={isStateDrawerOpen}
              aria-controls="state-drawer"
              onClick={() => {
                setIsLayoutDrawerOpen(false)
                setIsNotificationDrawerOpen(false)
                setIsProfileDrawerOpen(false)
                setIsStateDrawerOpen((current) => !current)
              }}
            >
              <span>{`State: ${
                STATE_OPTIONS.find((stateOption) => stateOption.id === activeStateOptionId)?.label ?? 'Opened'
              }`}</span>
              <span className="global-chip-caret material-symbols-outlined" aria-hidden="true">
                expand_more
              </span>
            </button>

            {isStateDrawerOpen ? (
              <div id="state-drawer" className="state-drawer" role="dialog" aria-label="Select state">
                <div className="state-drawer-list" role="listbox" aria-label="State options">
                  {STATE_OPTIONS.map((stateOption) => {
                    const isSelected = activeStateOptionId === stateOption.id
                    return (
                      <button
                        type="button"
                        key={stateOption.id}
                        className={`state-drawer-row ${stateOption.disabled ? 'is-disabled' : ''} ${
                          stateOption.id === 'resolved' ? 'is-resolved' : ''
                        }`}
                        role="option"
                        aria-selected={isSelected}
                        disabled={stateOption.disabled}
                        onClick={() => {
                          if (!stateOption.disabled) {
                            setActiveStateOptionId(stateOption.id)
                          }
                        }}
                      >
                        <span className={`state-drawer-radio ${isSelected ? 'is-selected' : ''}`} aria-hidden="true" />
                        <span>{stateOption.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
          <button type="button" className="global-icon-btn material-symbols-outlined" aria-label="Refresh workspace">
            refresh
          </button>
          <div
            className={`global-notification-menu ${isNotificationDrawerOpen ? 'is-open' : ''}`}
            ref={notificationDrawerRef}
          >
            <button
              type="button"
              className="global-icon-btn material-symbols-outlined"
              aria-label="Notifications"
              aria-expanded={isNotificationDrawerOpen}
              aria-controls="notifications-drawer"
              onClick={() => {
                setIsLayoutDrawerOpen(false)
                setIsStateDrawerOpen(false)
                setIsProfileDrawerOpen(false)
                setIsNotificationDrawerOpen((current) => !current)
              }}
            >
              notifications
            </button>

            {isNotificationDrawerOpen ? (
              <div
                id="notifications-drawer"
                className="notifications-drawer"
                role="dialog"
                aria-label="Alerts and notifications"
              >
                <div className="notifications-drawer-header">
                  <h2>Alerts &amp; notifications</h2>
                </div>

                <div className="notifications-filter-row" role="tablist" aria-label="Notification filters">
                  {NOTIFICATION_FILTERS.map((filterOption) => {
                    const isActive = activeNotificationFilterId === filterOption.id
                    return (
                      <button
                        type="button"
                        key={filterOption.id}
                        role="tab"
                        aria-selected={isActive}
                        className={`notifications-filter-btn ${isActive ? 'is-active' : ''}`}
                        onClick={() => setActiveNotificationFilterId(filterOption.id)}
                      >
                        {filterOption.label}
                      </button>
                    )
                  })}
                </div>

                <div className="notifications-list" role="list" aria-label="Alert results">
                  {NOTIFICATION_ITEMS.map((notificationItem, notificationIndex) => (
                    <article
                      key={notificationItem.id}
                      className={`notification-row ${notificationIndex < 2 ? 'is-unread' : ''}`}
                      role="listitem"
                    >
                      <div className="notification-row-main">
                        <p className="notification-row-name">{notificationItem.patientName}</p>
                        <p className="notification-row-meta">{notificationItem.demographics}</p>
                        <p className="notification-row-id">{notificationItem.accession}</p>
                      </div>

                      <div className="notification-row-side">
                        <p className={`notification-row-finding ${notificationItem.findingTone === 'empty' ? 'is-empty' : ''}`}>
                          {notificationItem.finding}
                        </p>

                        {notificationItem.extraFindingLine ? (
                          <p className="notification-row-extra">{notificationItem.extraFindingLine}</p>
                        ) : null}
                      </div>
                    </article>
                  ))}

                  <div className="notifications-load-more-wrap">
                    {isLoadingOlderNotifications ? (
                      <div className="notifications-load-spinner" role="status" aria-label="Loading older notifications">
                        <span className="notifications-load-spinner-icon" aria-hidden="true" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="notifications-load-more-btn"
                        onClick={() => {
                          if (isLoadingOlderNotifications) {
                            return
                          }

                          setIsLoadingOlderNotifications(true)

                          if (loadOlderNotificationsTimeoutRef.current !== null) {
                            window.clearTimeout(loadOlderNotificationsTimeoutRef.current)
                          }

                          loadOlderNotificationsTimeoutRef.current = window.setTimeout(() => {
                            setIsLoadingOlderNotifications(false)
                            loadOlderNotificationsTimeoutRef.current = null
                          }, 1100)
                        }}
                      >
                        Load older notifications
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div
            className={`global-profile-menu ${isProfileDrawerOpen ? 'is-open' : ''}`}
            ref={profileDrawerRef}
          >
            <button
              type="button"
              className="global-avatar-btn"
              aria-label="User profile"
              aria-expanded={isProfileDrawerOpen}
              aria-controls="profile-drawer"
              onClick={() => {
                setIsLayoutDrawerOpen(false)
                setIsStateDrawerOpen(false)
                setIsNotificationDrawerOpen(false)
                setIsProfileDrawerOpen((current) => !current)
              }}
            >
              IN
            </button>

            {isProfileDrawerOpen ? (
              <div id="profile-drawer" className="profile-drawer" role="dialog" aria-label="User profile menu">
                <div className="profile-drawer-header">
                  <div className="profile-drawer-identity">
                    <span className="profile-drawer-avatar" aria-hidden="true">IN</span>
                    <div className="profile-drawer-copy">
                      <p className="profile-drawer-inst">Institution name</p>
                      <p className="profile-drawer-user">User name</p>
                    </div>
                  </div>

                  <button type="button" className="profile-drawer-refresh-btn material-symbols-outlined" aria-label="Refresh user context">
                    refresh
                  </button>
                </div>

                <div className="profile-drawer-divider" />

                <nav className="profile-drawer-nav" aria-label="Profile actions">
                  {PROFILE_MENU_ITEMS.map((menuItem) => (
                    <button type="button" key={menuItem} className="profile-drawer-link">
                      {menuItem}
                    </button>
                  ))}
                </nav>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main
        className="workspace-shell"
        ref={containerRef}
        style={
          {
            '--left-width': `${sectionWidths[0]}%`,
            '--center-width': `${sectionWidths[1]}%`,
            '--right-width': `${sectionWidths[2]}%`,
          } as CSSProperties
        }
      >
      <section className="panel panel-left" aria-label="Studies navigation">
        <header className="panel-header">
          <h1>Overview</h1>
          <div className={`overview-options-menu ${isOverviewOptionsOpen ? 'is-open' : ''}`} ref={overviewOptionsRef}>
            <button
              type="button"
              className="ghost-btn menu-icon-btn"
              aria-label="More options"
              aria-expanded={isOverviewOptionsOpen}
              aria-controls="overview-options-drawer"
              onClick={() => setIsOverviewOptionsOpen((current) => !current)}
            >
              <span className="material-symbols-outlined menu-dots-icon" aria-hidden="true">more_vert</span>
            </button>

            {isOverviewOptionsOpen ? (
              <div
                id="overview-options-drawer"
                className="overview-options-drawer"
                role="dialog"
                aria-label="Overview options"
              >
                <p className="overview-options-title">Grouping by</p>

                <div className="overview-options-list" role="radiogroup" aria-label="Grouping mode">
                  {OVERVIEW_GROUPING_OPTIONS.map((option) => {
                    const isSelected = overviewGroupingMode === option.id

                    return (
                      <button
                        type="button"
                        key={option.id}
                        className="overview-options-row"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setOverviewGroupingMode(option.id)}
                      >
                        <span className={`overview-options-radio ${isSelected ? 'is-selected' : ''}`} aria-hidden="true" />
                        <span>{option.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="overview-options-divider" />

                <button
                  type="button"
                  className="overview-options-row"
                  role="checkbox"
                  aria-checked={includeSourcesWithoutResults}
                  onClick={() => setIncludeSourcesWithoutResults((current) => !current)}
                >
                  <span className={`overview-options-check ${includeSourcesWithoutResults ? 'is-selected' : ''}`} aria-hidden="true">
                    {includeSourcesWithoutResults ? (
                      <span className="material-symbols-outlined overview-options-check-icon">check</span>
                    ) : null}
                  </span>
                  <span>Include sources with no results</span>
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="study-tree">
          <div className={`study-selector ${isStudyPickerOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="study-selector-home"
              onClick={() => {
                setIsStudyPickerOpen(false)
                closeViewer('ct-main')
              }}
              aria-label="Return to studies overview"
            >
              <span className="tree-folder-icon material-symbols-outlined" aria-hidden="true">
                folder
              </span>
              <span className="study-selector-title">Patient data</span>
            </button>

            <div className="study-selector-dropdown" ref={studyPickerRef}>
              <button
                type="button"
                className={`study-selector-trigger ${isStudyPickerOpen ? 'is-open' : ''}`}
                onClick={() => setIsStudyPickerOpen((current) => !current)}
                aria-expanded={isStudyPickerOpen}
                aria-label="Select CT studies"
              >
                <span className="study-selector-current">
                  {selectedStudyCount} {selectedStudyCount === 1 ? 'study' : 'studies'}
                </span>
                <span className={`study-selector-chevron material-symbols-outlined ${isStudyPickerOpen ? 'is-open' : ''}`} aria-hidden="true">
                  expand_more
                </span>
              </button>

              {isStudyPickerOpen ? (
                <div className="study-picker" role="dialog" aria-label="CT study picker">
                  {(['Current', 'Prior'] as const).map((group) => (
                    <div key={group} className="study-picker-group">
                      <p className="study-picker-label">{group}</p>
                      <ul className="study-picker-list">
                        {STUDY_OPTIONS.filter((option) => option.group === group).map((option) => {
                          const isChecked = selectedStudyIds.includes(option.id)

                          return (
                            <li key={option.id}>
                              <button
                                type="button"
                                className="study-picker-option"
                                onClick={() => toggleStudySelection(option.id)}
                              >
                                <span className={`study-picker-box ${isChecked ? 'is-checked' : ''}`} aria-hidden="true">
                                  {isChecked ? (
                                    <span className="material-symbols-outlined study-picker-check-icon">check</span>
                                  ) : null}
                                </span>
                                <span>{option.label}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="study-tree-body">{renderTree(visibleTreeNodes)}</div>
        </div>

        {renderFindingMap()}
      </section>

      <button
        type="button"
        className="drag-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize left and middle sections"
        aria-valuenow={Math.round(sectionWidths[0])}
        onPointerDown={(event) => handleDividerPointerDown(0, event)}
        onKeyDown={(event) => handleDividerKeyDown(0, event)}
      >
        <span />
      </button>

      <section
        className={`panel panel-center ${isViewerOpen ? 'viewer-open' : ''} ${
          isViewerFullscreen ? 'viewer-local-fullscreen' : ''
        }`}
        aria-label="Study thumbnails"
      >
        <header className={`panel-header ${isViewerOpen ? 'panel-header-viewer' : ''}`}>
          {isViewerOpen ? (
            <button
              type="button"
              className="ghost-btn icon-btn material-symbols-outlined"
              aria-label="Back to thumbnails"
              onClick={() => closeViewer()}
            >
              close
            </button>
          ) : null}

          <h2>
            {isViewerOpen
              ? `Preview: ${activeFinding.title} (${activeThumbnailIndex + 1}/${activeFindingThumbnails.length})`
              : `Images (${THUMBNAILS.length})`}
          </h2>

          <div className="panel-header-actions">
            {isViewerOpen ? (
              <>
                <button
                  type="button"
                  className="ghost-btn icon-btn viewer-nav-btn material-symbols-outlined"
                  aria-label="Previous image"
                  onClick={() => selectViewerThumbnail(-1)}
                >
                  chevron_left
                </button>
                <button
                  type="button"
                  className="ghost-btn icon-btn viewer-nav-btn material-symbols-outlined"
                  aria-label="Next image"
                  onClick={() => selectViewerThumbnail(1)}
                >
                  chevron_right
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`ghost-btn ghost-toggle-btn center-view-toggle-btn ${
                    isGroupedThumbView ? 'is-active' : ''
                  }`}
                  aria-label={isGroupedThumbView ? 'Switch to flat image grid' : 'Switch to grouped image view'}
                  aria-pressed={isGroupedThumbView}
                  onClick={() => setIsGroupedThumbView((current) => !current)}
                >
                  <span className="material-symbols-outlined toggle-icon" aria-hidden="true">
                    view_agenda
                  </span>
                </button>
                <button type="button" className="ghost-btn menu-icon-btn material-symbols-outlined" aria-label="Grid options">
                  more_vert
                </button>
              </>
            )}
          </div>
        </header>

        {isViewerOpen ? (
          <section
            className={`viewer-screen ${isViewerFullscreen ? 'is-fullscreen' : ''}`}
            aria-label="Focused image viewer"
          >
            <div
              className={`viewer-stage viewer-${activeThumbnail.id}`}
              style={
                {
                  '--viewer-scale': viewerTransform.scale,
                  '--viewer-pan-x': `${viewerTransform.panX}px`,
                  '--viewer-pan-y': `${viewerTransform.panY}px`,
                  '--dot-inverse-scale': `${1 / viewerTransform.scale}`,
                  '--viewer-square-size': viewerSquareSize ? `${viewerSquareSize}px` : undefined,
                } as CSSProperties
              }
              onWheel={handleViewerWheel}
            >
              <button
                type="button"
                className="viewer-chip"
                aria-label="Open in viewer"
                onClick={openDedicatedViewer}
              >
                <span className="material-symbols-outlined viewer-chip-icon" aria-hidden="true">
                  open_in_new
                </span>
                <span>Inspect</span>
              </button>

              <div className="viewer-action-rail" aria-label="Viewer actions">
                <button
                  type="button"
                  className={`viewer-action-btn viewer-action-expand material-symbols-outlined ${
                    isViewerFullscreen ? 'is-active' : ''
                  }`}
                  aria-label={isViewerFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  aria-pressed={isViewerFullscreen}
                  onClick={toggleViewerFullscreen}
                >
                  {isViewerFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </button>
                <button
                  type="button"
                  className="viewer-action-btn material-symbols-outlined"
                  aria-label="Zoom in"
                  onClick={() => adjustViewerScale(1)}
                >
                  zoom_in
                </button>
                <button
                  type="button"
                  className="viewer-action-btn material-symbols-outlined"
                  aria-label="Zoom out"
                  onClick={() => adjustViewerScale(-1)}
                >
                  zoom_out
                </button>
              </div>

              <div
                className={`viewer-frame viewer-${activeThumbnail.id}`}
                ref={viewerFrameRef}
                onPointerDown={handleViewerPointerDown}
                onPointerMove={handleViewerPointerMove}
                onPointerUp={finishViewerPan}
                onPointerLeave={finishViewerPan}
                onPointerCancel={finishViewerPan}
              />

              <button
                type="button"
                className="filmstrip-toggle filmstrip-toggle-floating"
                aria-expanded={isViewerFilmstripVisible}
                aria-controls="viewer-filmstrip"
                onClick={toggleFilmstripVisibility}
              >
                <span
                  className="filmstrip-toggle-icon-wrap"
                  aria-hidden="true"
                >
                  <span
                    className={`material-symbols-outlined filmstrip-toggle-icon ${isViewerFilmstripVisible ? 'is-open' : ''}`}
                  >
                    chevron_right
                  </span>
                </span>
                <span>{isViewerFilmstripVisible ? 'Hide thumbnails' : 'Show thumbnails'}</span>
              </button>
            </div>

            <div
              id="viewer-filmstrip"
              className={`filmstrip-shell ${isViewerFilmstripVisible ? 'is-open' : ''}`}
              aria-hidden={!isViewerFilmstripVisible}
            >
              <div className="filmstrip">
                {activeFindingThumbnails.map((thumbnail) => (
                  <button
                    type="button"
                    key={thumbnail.id}
                    className={`thumb-card ${activeThumbnail.id === thumbnail.id ? 'is-active' : ''}`}
                    onClick={() => {
                      if (activeThumbnail.id === thumbnail.id) {
                        closeViewer()
                        return
                      }

                      openViewer(thumbnail.findingId, undefined, thumbnail.id)
                    }}
                  >
                    <div className={`thumb-image ${thumbnail.id}`} style={getThumbnailImageStyle(thumbnail.id)} />
                    <p>{thumbnail.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : isGroupedThumbView ? (
          <div className="grouped-thumb-view">
            {THUMBNAIL_GROUPS.map((group) => {
              const groupThumbnails = THUMBNAILS.filter((thumbnail) =>
                group.findingIds.includes(thumbnail.findingId),
              )

              if (groupThumbnails.length === 0) {
                return null
              }

              return (
                <section key={group.id} className="thumb-group" aria-label={`${group.title} image group`}>
                  <header className="thumb-group-header">
                    <div className="thumb-group-title-wrap">
                      <span className="thumb-group-title">{group.title}</span>
                    </div>
                    <span className="thumb-group-count">{groupThumbnails.length} images</span>
                  </header>

                  <div className="thumb-group-grid">
                    {groupThumbnails.map((thumbnail) => (
                      <button
                        type="button"
                        key={thumbnail.id}
                        className="thumb-card"
                        onClick={() => openViewer(thumbnail.findingId, undefined, thumbnail.id)}
                      >
                        <div className={`thumb-image ${thumbnail.id}`} style={getThumbnailImageStyle(thumbnail.id)} />
                        <p>{thumbnail.label}</p>
                      </button>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="thumb-grid">
            {THUMBNAILS.map((thumbnail) => (
              <button
                type="button"
                key={thumbnail.id}
                className="thumb-card"
                onClick={() => openViewer(thumbnail.findingId, undefined, thumbnail.id)}
              >
                <div className={`thumb-image ${thumbnail.id}`} style={getThumbnailImageStyle(thumbnail.id)} />
                <p>{thumbnail.label}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        className="drag-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize middle and right sections"
        aria-valuenow={Math.round(sectionWidths[1])}
        onPointerDown={(event) => handleDividerPointerDown(1, event)}
        onKeyDown={(event) => handleDividerKeyDown(1, event)}
      >
        <span />
      </button>

      <section className="panel panel-right" aria-label="AI findings">
        <header className="panel-header">
          <h2>Results ({FINDINGS.length})</h2>
          <div className="panel-header-actions">
            <button
              type="button"
              className={`ghost-btn ghost-toggle-btn ${showResultThumbnails ? 'is-active' : ''}`}
              aria-label={showResultThumbnails ? 'Hide result thumbnails' : 'Show result thumbnails'}
              aria-pressed={showResultThumbnails}
              onClick={() => setShowResultThumbnails((current) => !current)}
            >
              <span className="material-symbols-outlined toggle-icon" aria-hidden="true">
                grid_view
              </span>
            </button>

            <button type="button" className="ghost-btn" aria-label="Copy all findings">
              Copy all
            </button>
          </div>
        </header>

        <ul className="findings-list">
          {FINDINGS.map((finding) => {
            const isTreeMetricActive = selectedTreeRowId === finding.nodeId
            const isDeleted = deletedFindingIds.includes(finding.id)

            return (
            <li key={finding.id}>
              <article
                className={`result-card ${activeFinding.id === finding.id && isViewerOpen ? 'is-selected' : ''} ${
                  isDeleted ? 'is-deleted' : ''
                }`}
                role={isDeleted ? undefined : 'button'}
                tabIndex={isDeleted ? -1 : 0}
                ref={(element) => {
                  resultCardRefs.current[finding.id] = element
                }}
                onPointerDown={isDeleted ? undefined : handleResultCardPointerDown}
                onPointerUp={isDeleted ? undefined : () => handleResultCardPointerUp(finding.id, finding.nodeId)}
                onClick={isDeleted ? undefined : handleResultCardClick}
                onKeyDown={(event) => {
                  if (isDeleted) {
                    return
                  }

                  if (event.key !== 'Enter' && event.key !== ' ') {
                    return
                  }

                  event.preventDefault()
                  activateFindingCard(finding.id, finding.nodeId)
                }}
              >
                {isDeleted ? (
                  <>
                    <div className="result-card-deleted-row">
                      <p className="result-card-deleted-title">
                        Deleted: <span>{finding.title}</span>
                      </p>
                    </div>

                    <div className="result-card-actions result-card-deleted-actions" aria-hidden="true">
                      <button
                        type="button"
                        className="result-card-action-btn result-card-undo-btn material-symbols-outlined"
                        tabIndex={-1}
                        aria-label={`Restore ${finding.title}`}
                        onMouseDown={stopActionEvent}
                        onPointerDown={stopActionEvent}
                        onPointerUp={stopActionEvent}
                        onClick={(event) => {
                          stopActionEvent(event)
                          restoreFinding(finding.id)
                        }}
                      >
                        undo
                      </button>
                    </div>

                    <button
                      type="button"
                      className="result-card-menu-btn material-symbols-outlined"
                      aria-label={`More actions for deleted ${finding.title}`}
                      onMouseDown={stopActionEvent}
                      onPointerDown={stopActionEvent}
                      onPointerUp={stopActionEvent}
                      onClick={stopActionEvent}
                    >
                      more_vert
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="result-card-menu-btn material-symbols-outlined"
                      aria-label={`More actions for ${finding.title}`}
                      onMouseDown={stopActionEvent}
                      onPointerDown={stopActionEvent}
                      onPointerUp={stopActionEvent}
                      onClick={stopActionEvent}
                    >
                      more_vert
                    </button>

                    <div className="result-card-actions" aria-hidden="true">
                      <button
                        type="button"
                        className="result-card-action-btn material-symbols-outlined"
                        tabIndex={-1}
                        aria-label="Finding info"
                        onMouseDown={stopActionEvent}
                        onPointerDown={stopActionEvent}
                        onPointerUp={stopActionEvent}
                        onClick={(event) => {
                          stopActionEvent(event)
                          openFindingInfoModal(finding.title)
                        }}
                      >
                        info
                      </button>
                      <button
                        type="button"
                        className="result-card-action-btn material-symbols-outlined"
                        tabIndex={-1}
                        aria-label="Open in viewer"
                        onMouseDown={stopActionEvent}
                        onPointerDown={stopActionEvent}
                        onPointerUp={stopActionEvent}
                        onClick={(event) => {
                          stopActionEvent(event)
                          const relatedThumbnail = THUMBNAILS.find(
                            (thumbnail) => thumbnail.findingId === finding.id,
                          )
                          openDedicatedViewerFromSource(
                            'results',
                            finding.id,
                            finding.nodeId,
                            relatedThumbnail?.id,
                          )
                        }}
                      >
                        open_in_new
                      </button>
                      <button
                        type="button"
                        className="result-card-action-btn material-symbols-outlined"
                        tabIndex={-1}
                        aria-label="Delete finding"
                        onMouseDown={stopActionEvent}
                        onPointerDown={stopActionEvent}
                        onPointerUp={stopActionEvent}
                        onClick={(event) => {
                          stopActionEvent(event)
                          deleteFinding(finding.id)
                        }}
                      >
                        delete
                      </button>
                    </div>

                    <h3>{finding.title}</h3>
                    <p>{finding.summary}</p>
                    <p className={`result-metric ${isTreeMetricActive ? 'is-active' : ''}`}>
                      <span className="result-metric-value">{finding.metric}</span>
                    </p>
                    {showResultThumbnails ? (
                      <div className="result-thumbs">
                        {THUMBNAILS.filter((thumbnail) => thumbnail.findingId === finding.id).map(
                          (thumbnail) => (
                            <button
                              type="button"
                              key={`${finding.id}-${thumbnail.id}`}
                              className={`result-thumb-item ${
                                activeThumbnail.id === thumbnail.id && isViewerOpen ? 'is-active' : ''
                              }`}
                              onPointerDown={(event) => {
                                event.stopPropagation()
                              }}
                              onPointerUp={(event) => {
                                event.stopPropagation()
                              }}
                              onClick={(event) => {
                                event.stopPropagation()

                                if (activeThumbnail.id === thumbnail.id && isViewerOpen) {
                                  closeViewer()
                                  return
                                }

                                openViewer(finding.id, finding.nodeId, thumbnail.id)
                              }}
                              aria-label={`Open ${finding.title} image ${thumbnail.label}`}
                            >
                              <span className={`thumb-image ${thumbnail.id}`} style={getThumbnailImageStyle(thumbnail.id)} />
                            </button>
                          ),
                        )}
                      </div>
                    ) : null}
                  </>
                )}
              </article>
            </li>
            )
          })}
        </ul>
      </section>
    </main>
    {findingInfoModal}
    </div>
  )
}

export default App
