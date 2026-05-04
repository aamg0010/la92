/**
 * API Client for PostgREST
 * Mimics Supabase query builder syntax for easy migration
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type QueryParams = Record<string, string>;

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

class QueryBuilder<T = unknown> {
  private table: string;
  private queryParams: QueryParams = {};
  private headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private body: unknown = null;
  private returnSingle = false;
  private returnMaybeSingle = false;
  private returnData = false;

  constructor(table: string) {
    this.table = table;
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.headers['X-Session-Token'] = token;
    }
  }

  select(columns: string = '*'): this {
    this.queryParams['select'] = columns;
    this.returnData = true;
    return this;
  }

  eq(column: string, value: string | number | boolean): this {
    this.queryParams[column] = `eq.${value}`;
    return this;
  }

  neq(column: string, value: string | number | boolean): this {
    this.queryParams[column] = `neq.${value}`;
    return this;
  }

  gt(column: string, value: string | number): this {
    this.queryParams[column] = `gt.${value}`;
    return this;
  }

  gte(column: string, value: string | number): this {
    this.queryParams[column] = `gte.${value}`;
    return this;
  }

  lt(column: string, value: string | number): this {
    this.queryParams[column] = `lt.${value}`;
    return this;
  }

  lte(column: string, value: string | number): this {
    this.queryParams[column] = `lte.${value}`;
    return this;
  }

  like(column: string, pattern: string): this {
    this.queryParams[column] = `like.${pattern}`;
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.queryParams[column] = `ilike.${pattern}`;
    return this;
  }

  in(column: string, values: (string | number)[]): this {
    this.queryParams[column] = `in.(${values.join(',')})`;
    return this;
  }

  is(column: string, value: 'null' | 'true' | 'false'): this {
    this.queryParams[column] = `is.${value}`;
    return this;
  }

  or(filters: string[]): this {
    this.queryParams['or'] = `(${filters.join(',')})`;
    return this;
  }

  and(filters: string[]): this {
    this.queryParams['and'] = `(${filters.join(',')})`;
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    const direction = options?.ascending === false ? '.desc' : '';
    const nulls = options?.nullsFirst ? '.nullsfirst' : '';
    this.queryParams['order'] = `${column}${direction}${nulls}`;
    return this;
  }

  limit(count: number): this {
    this.queryParams['limit'] = count.toString();
    return this;
  }

  offset(count: number): this {
    this.queryParams['offset'] = count.toString();
    return this;
  }

  range(from: number, to: number): this {
    this.headers['Range'] = `${from}-${to}`;
    this.headers['Range-Unit'] = 'items';
    return this;
  }

  single(): this {
    this.returnSingle = true;
    this.headers['Accept'] = 'application/vnd.pgrst.object+json';
    return this;
  }

  maybeSingle(): this {
    this.returnMaybeSingle = true;
    this.headers['Accept'] = 'application/vnd.pgrst.object+json';
    return this;
  }

  insert(data: Partial<T> | Partial<T>[]): this {
    this.method = 'POST';
    this.body = data;
    this.headers['Prefer'] = 'return=representation';
    return this;
  }

  update(data: Partial<T>): this {
    this.method = 'PATCH';
    this.body = data;
    this.headers['Prefer'] = 'return=representation';
    return this;
  }

  upsert(data: Partial<T> | Partial<T>[], options?: { onConflict?: string }): this {
    this.method = 'POST';
    this.body = data;
    this.headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
    if (options?.onConflict) {
      this.queryParams['on_conflict'] = options.onConflict;
    }
    return this;
  }

  delete(): this {
    this.method = 'DELETE';
    this.headers['Prefer'] = 'return=representation';
    return this;
  }

  async execute(): Promise<QueryResult<T[]>> {
    try {
      const queryString = Object.entries(this.queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      const url = `${API_URL}/${this.table}${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url, {
        method: this.method,
        headers: this.headers,
        body: this.body ? JSON.stringify(this.body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.details || `HTTP ${response.status}`);
      }

      // Handle 204 No Content (for deletes without return)
      if (response.status === 204) {
        return { data: null, error: null };
      }

      const data = await response.json();

      // Get count from headers if requested
      const contentRange = response.headers.get('Content-Range');
      const count = contentRange ? parseInt(contentRange.split('/')[1]) : undefined;

      return { data, error: null, count };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Auto-execute when awaited
  then<TResult1 = QueryResult<T | T[] | null>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T | T[] | null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then((result) => {
      if (this.returnSingle) {
        const data = Array.isArray(result.data) ? result.data[0] : result.data;
        if (!data && !this.returnMaybeSingle) {
          return { data: null, error: new Error('Row not found') };
        }
        return { ...result, data };
      }
      if (this.returnMaybeSingle) {
        const data = Array.isArray(result.data) ? result.data[0] || null : result.data;
        return { ...result, data };
      }
      return result;
    }).then(onfulfilled, onrejected);
  }
}

// Storage API (for file uploads)
class StorageClient {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(path: string, file: File, options?: { upsert?: boolean }): Promise<{ data: { path: string } | null; error: Error | null }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadHeaders: Record<string, string> = {};
      const token = localStorage.getItem('auth_token');
      if (token) {
        uploadHeaders['X-Session-Token'] = token;
      }

      const response = await fetch(`${API_URL}/rpc/upload_file`, {
        method: 'POST',
        headers: uploadHeaders,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return { data: { path: data.path }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  getPublicUrl(path: string): { data: { publicUrl: string } } {
    // For now, return a placeholder URL structure
    // This will need to be configured based on your file storage setup
    return {
      data: {
        publicUrl: `${API_URL}/storage/${this.bucket}/${path}`,
      },
    };
  }
}

class Storage {
  from(bucket: string): StorageClient {
    return new StorageClient(bucket);
  }
}

// Main API client
export const api = {
  from<T = unknown>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table);
  },

  storage: new Storage(),

  // RPC call for stored procedures
  async rpc<T = unknown>(
    fn: string,
    params?: Record<string, unknown>
  ): Promise<QueryResult<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['X-Session-Token'] = token;
      }

      const response = await fetch(`${API_URL}/rpc/${fn}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params || {}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },
};

export default api;
