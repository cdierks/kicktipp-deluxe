import type { ComponentProps, ComponentType } from 'react'
import {
  ArrowClockwise,
  ArrowsDownUp,
  BookmarkSimple,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ChartBar,
  Check,
  CheckCircle,
  Database,
  DownloadSimple,
  Envelope,
  Fire,
  Lock,
  Medal,
  Monitor,
  Moon,
  Palette,
  PencilSimple,
  Plus,
  Scales,
  Shield,
  SignOut,
  Smiley,
  SoccerBall,
  Spinner,
  SquaresFour,
  Star,
  Sun,
  Table,
  Target,
  Trash,
  Trophy,
  TShirt,
  UploadSimple,
  User,
  UserMinus,
  UserPlus,
  Users,
  Warning,
  X,
} from '@phosphor-icons/react/ssr'

type IconProps = Omit<ComponentProps<typeof Sun>, 'weight'> & { strokeWidth?: number }

function withWeight(Icon: ComponentType<ComponentProps<typeof Sun>>, weight: ComponentProps<typeof Sun>['weight'] = 'regular') {
  return function WrappedIcon({ strokeWidth: _strokeWidth, ...props }: IconProps) {
    return <Icon {...props} weight={weight} />
  }
}

export const IconSun = withWeight(Sun)
export const IconMoon = withWeight(Moon)
export const IconMonitor = withWeight(Monitor)
export const IconLogout = withWeight(SignOut)
export const IconLayoutDashboard = withWeight(SquaresFour)
export const IconPencil = withWeight(PencilSimple)
export const IconUser = withWeight(User)
export const IconShield = withWeight(Shield)
export const IconUserOff = withWeight(UserMinus)
export const IconChevronLeft = withWeight(CaretLeft)
export const IconChevronRight = withWeight(CaretRight)
export const IconTrophy = withWeight(Trophy)
export const IconMedal = withWeight(Medal)
export const IconBallFootball = withWeight(SoccerBall)
export const IconTable = withWeight(Table)
export const IconChartBar = withWeight(ChartBar)
export const IconPokerChip = withWeight(Star)
export const IconCheck = withWeight(Check)
export const IconCircleCheckFilled = withWeight(CheckCircle, 'fill')
export const IconLoader2 = withWeight(Spinner)
export const IconAlertTriangle = withWeight(Warning)
export const IconScale = withWeight(Scales)
export const IconMoodSmileBeam = withWeight(Smiley)
export const IconFlame = withWeight(Fire)
export const IconTarget = withWeight(Target)
export const IconRefresh = withWeight(ArrowClockwise)
export const IconTrash = withWeight(Trash)
export const IconArrowsSort = withWeight(ArrowsDownUp)
export const IconBookmark = withWeight(BookmarkSimple)
export const IconDatabaseExport = withWeight(DownloadSimple)
export const IconDatabaseImport = withWeight(UploadSimple)
export const IconPalette = withWeight(Palette)
export const IconMail = withWeight(Envelope)
export const IconLock = withWeight(Lock)
export const IconUsers = withWeight(Users)
export const IconCalendarEvent = withWeight(CalendarBlank)
export const IconShirt = withWeight(TShirt)
export const IconUserPlus = withWeight(UserPlus)
export const IconPlus = withWeight(Plus)
export const IconX = withWeight(X)
export const IconDatabase = withWeight(Database)
