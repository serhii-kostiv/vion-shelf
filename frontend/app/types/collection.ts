import type { User } from "next-auth";

export interface Collection {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  category: string;
  isPublic: boolean;
  user: User;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  externalId: string;
  type: string;
  title: string;
  posterUrl: string | null;
  metadata: Record<string, unknown>;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  collection?: {
    title: string;
    slug: string;
    userId: string;
  };
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DROPPED";
  rating: number | null;
  progress: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  mediaItem: MediaItem;
}

export interface CollectionDetail extends Collection {
  user: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  items: CollectionItem[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
