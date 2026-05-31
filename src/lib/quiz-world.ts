import {
  Bell,
  CircleAlert,
  ClipboardList,
  Clock,
  FileText,
  Globe2,
  Home,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogIn,
  ShieldCheck,
  Trophy,
  UserCog,
  UserRound,
  UserRoundPlus
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AppRoute = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type QuizState = "開始前" | "回答可能" | "回答済み" | "終了";

export type QuizSummary = {
  id: string;
  title: string;
  state: QuizState;
  category: string;
  startsIn: string;
  resultHref: string;
};

export type RankingRow = {
  name: string;
  answerRank: string;
  correctRank: string;
  result: "正解" | "不正解" | "未回答";
};

export const appName = "通知型早押しクイズワールド";

export const mainRoutes: AppRoute[] = [
  {
    href: "/home",
    label: "ホーム",
    description: "届いたクイズと回答履歴",
    icon: Home
  },
  {
    href: "/create",
    label: "出題",
    description: "四択クイズを作成",
    icon: ClipboardList
  },
  {
    href: "/world",
    label: "ワールド",
    description: "参加枠とシーズン",
    icon: Globe2
  },
  {
    href: "/profile",
    label: "プロフィール",
    description: "ランクと通知設定",
    icon: UserRound
  },
  {
    href: "/account",
    label: "アカウント",
    description: "ログアウトとパスワード変更",
    icon: UserCog
  },
  {
    href: "/invite",
    label: "招待",
    description: "招待コードとwaitlist",
    icon: KeyRound
  },
  {
    href: "/admin",
    label: "Admin",
    description: "10人テストの運用",
    icon: ShieldCheck
  }
];

export const publicRoutes: AppRoute[] = [
  {
    href: "/login",
    label: "ログイン",
    description: "登録済みユーザー",
    icon: LogIn
  },
  {
    href: "/signup",
    label: "登録",
    description: "招待コードで登録",
    icon: UserRoundPlus
  }
];

export const legalRoutes: AppRoute[] = [
  {
    href: "/legal/terms",
    label: "利用規約",
    description: "利用条件",
    icon: FileText
  },
  {
    href: "/legal/privacy",
    label: "プライバシー",
    description: "個人情報の扱い",
    icon: FileText
  }
];

export const worldSnapshot = {
  name: "Quiz World Season 0",
  season: "Season 0",
  members: 7,
  memberLimit: 10,
  nextLimit: 15,
  questions: 28,
  answers: 91,
  averageRating: "良問 62%",
  reportRate: "1.4%"
};

export const categories = [
  "雑学",
  "歴史",
  "地理",
  "科学",
  "エンタメ",
  "スポーツ",
  "言葉",
  "謎解き",
  "その他"
];

export const quizSummaries: QuizSummary[] = [
  {
    id: "launch-demo-001",
    title: "開始前の通知",
    state: "開始前",
    category: "科学",
    startsIn: "start_atまで 15秒",
    resultHref: "/result/launch-demo-001"
  },
  {
    id: "launch-demo-002",
    title: "回答可能な四択",
    state: "回答可能",
    category: "雑学",
    startsIn: "残り 42秒",
    resultHref: "/result/launch-demo-002"
  },
  {
    id: "launch-demo-003",
    title: "回答済みの問題",
    state: "回答済み",
    category: "その他",
    startsIn: "結果公開中",
    resultHref: "/result/launch-demo-003"
  }
];

export const rankingRows: RankingRow[] = [
  {
    name: "Aki",
    answerRank: "1位",
    correctRank: "1位",
    result: "正解"
  },
  {
    name: "Mina",
    answerRank: "2位",
    correctRank: "-",
    result: "不正解"
  },
  {
    name: "Yu",
    answerRank: "3位",
    correctRank: "2位",
    result: "正解"
  },
  {
    name: "Sora",
    answerRank: "-",
    correctRank: "-",
    result: "未回答"
  }
];

export const userSummary = {
  displayName: "demo_player",
  questionerRank: "Lv.1",
  questionerScore: 18,
  answerRank: "Lv.2",
  answerScore: 41,
  remainingLaunches: 2,
  deliverySize: 5,
  notificationMode: "通常モード",
  quietHours: "22:00 - 8:00",
  maxDailyNotifications: 5
};

export const adminActions = [
  "通報確認",
  "クイズ配信停止",
  "ユーザー停止",
  "waitlist操作",
  "招待コード発行",
  "参加枠変更"
];

export const phaseBadges = [
  {
    label: "通知",
    value: "15秒ポーリング",
    icon: Clock
  },
  {
    label: "更新",
    value: "home新着中心",
    icon: Bell
  },
  {
    label: "通知強化",
    value: "後続で検討",
    icon: CircleAlert
  },
  {
    label: "Preview",
    value: "限定テスト",
    icon: LayoutDashboard
  },
  {
    label: "Safety",
    value: "招待制",
    icon: ShieldCheck
  },
  {
    label: "Ranks",
    value: "出題/回答の二軸",
    icon: Trophy
  },
  {
    label: "Safety",
    value: "削除より停止",
    icon: ListChecks
  }
];
