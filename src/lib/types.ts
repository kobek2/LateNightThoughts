export type Stance = "agree" | "disagree";

export type Take = {
  id: string;
  text: string;
};

export type Source = {
  id: string;
  label: string;
  url: string;
  note: string;
};

export type PostStatus = "draft" | "published";

export type StoredPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  takes: Take[];
  sources: Source[];
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
};

export type StoredComment = {
  id: string;
  postId: string;
  takeId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
  visitorId: string;
};

export type StoredReaction = {
  takeId: string;
  visitorId: string;
  stance: Stance;
};

export type StoreData = {
  posts: StoredPost[];
  comments: StoredComment[];
  reactions: StoredReaction[];
};

export type TakeView = Take & {
  agree: number;
  disagree: number;
  stance: Stance | null;
};

export type CommentView = {
  id: string;
  takeId: string | null;
  takeText: string | null;
  authorName: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type PostView = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  readingMinutes: number;
  commentCount: number;
  leadTake: TakeView | null;
  takes: TakeView[];
  sources: Source[];
  comments: CommentView[];
};

export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
};

export type EditorPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  takes: Take[];
  sources: Source[];
  status: PostStatus;
  updatedAt: string;
  comments: {
    id: string;
    authorName: string;
    body: string;
    createdAt: string;
  }[];
};

export type SourceInput = {
  id?: string;
  label: string;
  url: string;
  note: string;
};

export type PostInput = {
  title: string;
  excerpt: string;
  body: string;
  tags: string;
  takes: { id?: string; text: string }[];
  sources: SourceInput[];
};

export type DraftInput = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string;
  takes: { id?: string; text: string }[];
  sources: SourceInput[];
};
