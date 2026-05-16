import { Send } from "lucide-react";
import {
  Badge,
  Field,
  PageHeader,
  SelectInput,
  Surface,
  TextArea,
  TextInput
} from "@/components/ui";
import { categories, userSummary } from "@/lib/quiz-world";

export const metadata = {
  title: "クイズ作成"
};

export default function CreatePage() {
  return (
    <>
      <PageHeader
        description="MVPでは四択クイズを優先します。配信対象抽選、出題回数、配信人数は次Phase以降でサーバー側に実装します。"
        eyebrow="Create"
        title="四択クイズを作成"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Surface>
          <form className="grid gap-4">
            <Field label="問題文">
              <TextArea placeholder="問題文を入力" />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              {["A", "B", "C", "D"].map((choice) => (
                <Field key={choice} label={`選択肢 ${choice}`}>
                  <TextInput placeholder={`選択肢 ${choice}`} />
                </Field>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="正解">
                <SelectInput>
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                  <option>D</option>
                </SelectInput>
              </Field>
              <Field label="難易度">
                <SelectInput>
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                </SelectInput>
              </Field>
              <Field label="カテゴリ">
                <SelectInput>
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <Field
              hint="その他を選んだ場合だけ保存対象。回答者と結果画面には表示しません。"
              label="カテゴリ補足"
            >
              <TextInput placeholder="例: ローカル文化、ボードゲームなど" />
            </Field>
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white"
              type="button"
            >
              <Send aria-hidden className="size-4" />
              出題する
            </button>
          </form>
        </Surface>
        <aside className="grid gap-3 self-start">
          <Surface>
            <p className="text-sm font-semibold">出題者ランク</p>
            <p className="mt-2 text-3xl font-semibold">{userSummary.questionerRank}</p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              今日の残り {userSummary.remainingLaunches} 回 / 今回 {userSummary.deliverySize} 人配信
            </p>
          </Surface>
          <Surface>
            <Badge tone="amber">注意</Badge>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              不適切、曖昧、個人情報を含む問題は停止対象です。削除より停止を優先し、admin操作は監査ログに残します。
            </p>
          </Surface>
        </aside>
      </div>
    </>
  );
}
