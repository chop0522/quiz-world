export type RankEventRow = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  reason: string;
  source_type: string;
  source_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type RankEventResponse = {
  id: string;
  type: string;
  points: number;
  reason: string;
  sourceType: string;
  sourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ApplyRankEventsRpcResponse = {
  status?: string;
  points?: number;
  eventsCreated?: number;
  answerScore?: number;
  answerRank?: number;
  questionerScore?: number;
  questionerRank?: number;
};

export function toRankEventResponse(event: RankEventRow): RankEventResponse {
  return {
    id: event.id,
    type: event.type,
    points: event.points,
    reason: event.reason,
    sourceType: event.source_type,
    sourceId: event.source_id,
    metadata: event.metadata,
    createdAt: event.created_at
  };
}
