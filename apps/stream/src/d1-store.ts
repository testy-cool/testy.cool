import type { Post, PostStore } from "./app";
import type { CreatePostInput, PostStatus, UpdatePostInput } from "./domain";

interface PostRow {
  id: number;
  body: string;
  tags: string;
  status: PostStatus;
  pinned: number;
  created_at: string;
  updated_at: string;
}

const columns = "id, body, tags, status, pinned, created_at, updated_at";

function fromRow(row: PostRow): Post {
  let tags: string[] = [];
  try {
    const value: unknown = JSON.parse(row.tags);
    if (Array.isArray(value) && value.every((tag) => typeof tag === "string"))
      tags = value;
  } catch {
    // Treat malformed legacy data as untagged instead of breaking the whole feed.
  }

  return {
    id: row.id,
    body: row.body,
    tags,
    status: row.status,
    pinned: row.pinned === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class D1PostStore implements PostStore {
  constructor(private readonly database: D1Database) {}

  private async find(id: number): Promise<Post | null> {
    const row = await this.database
      .prepare(`SELECT ${columns} FROM posts WHERE id = ?`)
      .bind(id)
      .first<PostRow>();
    return row ? fromRow(row) : null;
  }

  async list(query: string, limit: number): Promise<Post[]> {
    let statement: D1PreparedStatement;
    if (query) {
      const escaped = query.replace(/[\\%_]/g, "\\$&");
      const pattern = `%${escaped}%`;
      statement = this.database
        .prepare(
          `SELECT ${columns} FROM posts
           WHERE body LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\'
           ORDER BY pinned DESC, created_at DESC, id DESC LIMIT ?`,
        )
        .bind(pattern, pattern, limit);
    } else {
      statement = this.database
        .prepare(
          `SELECT ${columns} FROM posts
           ORDER BY pinned DESC, created_at DESC, id DESC LIMIT ?`,
        )
        .bind(limit);
    }

    const result = await statement.all<PostRow>();
    return result.results.map(fromRow);
  }

  async create(input: CreatePostInput): Promise<Post> {
    const result = await this.database
      .prepare("INSERT INTO posts (body, tags, status) VALUES (?, ?, ?)")
      .bind(input.body, JSON.stringify(input.tags), input.status)
      .run();
    const id = Number(result.meta.last_row_id);
    const post = await this.find(id);
    if (!post) throw new Error("Created post could not be read back");
    return post;
  }

  async update(id: number, input: UpdatePostInput): Promise<Post | null> {
    const setters: string[] = [];
    const values: unknown[] = [];

    if (input.body !== undefined) {
      setters.push("body = ?");
      values.push(input.body);
    }
    if (input.tags !== undefined) {
      setters.push("tags = ?");
      values.push(JSON.stringify(input.tags));
    }
    if (input.status !== undefined) {
      setters.push("status = ?");
      values.push(input.status);
    }
    if (input.pinned !== undefined) {
      setters.push("pinned = ?");
      values.push(input.pinned ? 1 : 0);
    }

    setters.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
    const result = await this.database
      .prepare(`UPDATE posts SET ${setters.join(", ")} WHERE id = ?`)
      .bind(...values, id)
      .run();
    if (result.meta.changes === 0) return null;
    return this.find(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.database
      .prepare("DELETE FROM posts WHERE id = ?")
      .bind(id)
      .run();
    return result.meta.changes > 0;
  }
}
