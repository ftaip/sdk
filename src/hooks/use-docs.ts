import { useCallback, useState } from "react";
import {
  createDoc,
  uploadDocs,
  listDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  docToMarkdown,
} from "../docs";
import type { AiParalegalClient } from "../client";
import type {
  DocCreateOptions,
  DocDetail,
  DocMarkdown,
  DocMeta,
  SessionContext,
  UseDocsReturn,
} from "../types";

/**
 * React hook for full document management — upload, list, read, edit,
 * delete, and convert to Markdown (via MarkItDown).
 *
 * ```tsx
 * const docs = useDocs(client, session);
 *
 * // Create a Word doc from markdown
 * await docs.create({ markdown: '# Hello', filename: 'letter', format: 'docx' });
 *
 * await docs.upload([wordFile, pdfFile]);
 * await docs.list();
 * // docs.documents => [{ id, filename, mime_type, size, created_at, updated_at }]
 *
 * await docs.get(id);
 * // docs.document => { ...meta, content }
 *
 * await docs.update(id, newFile);
 * await docs.update(id, 'new text content');
 *
 * await docs.toMarkdown(id);
 * // docs.markdown => { id, filename, markdown, mime_type }
 *
 * await docs.remove(id);
 * ```
 */
export function useDocs(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseDocsReturn {
  const [documents, setDocuments] = useState<DocMeta[]>([]);
  const [document, setDocument] = useState<DocDetail | null>(null);
  const [markdown, setMarkdown] = useState<DocMarkdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const requireSession = useCallback(() => {
    if (!client || !session) {
      throw new Error("Client and session are required");
    }
    return { client, session };
  }, [client, session]);

  const run = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      try {
        return await fn();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const create = useCallback(
    async (options: DocCreateOptions) => {
      const { client: c, session: s } = requireSession();
      await run(async () => {
        const response = await createDoc(c, s.sessionToken, options);
        setDocuments((prev) => [...prev, response.data]);
      });
    },
    [requireSession, run],
  );

  const upload = useCallback(
    async (files: File[]) => {
      const { client: c, session: s } = requireSession();
      await run(async () => {
        const response = await uploadDocs(c, s.sessionToken, files);
        setDocuments((prev) => [...prev, ...response.data.documents]);
      });
    },
    [requireSession, run],
  );

  const list = useCallback(async () => {
    const { client: c, session: s } = requireSession();
    await run(async () => {
      const response = await listDocs(c, s.sessionToken);
      setDocuments(response.data.documents);
    });
  }, [requireSession, run]);

  const get = useCallback(
    async (documentId: string) => {
      const { client: c, session: s } = requireSession();
      await run(async () => {
        const response = await getDoc(c, s.sessionToken, documentId);
        setDocument(response.data);
      });
    },
    [requireSession, run],
  );

  const update = useCallback(
    async (documentId: string, fileOrContent: File | string) => {
      const { client: c, session: s } = requireSession();
      await run(async () => {
        const response = await updateDoc(
          c,
          s.sessionToken,
          documentId,
          fileOrContent,
        );
        setDocuments((prev) =>
          prev.map((d) => (d.id === documentId ? response.data : d)),
        );
        setDocument((prev) =>
          prev?.id === documentId
            ? { ...response.data, content: prev.content }
            : prev,
        );
      });
    },
    [requireSession, run],
  );

  const remove = useCallback(
    async (documentId: string) => {
      const { client: c, session: s } = requireSession();
      await run(async () => {
        await deleteDoc(c, s.sessionToken, documentId);
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        setDocument((prev) => (prev?.id === documentId ? null : prev));
      });
    },
    [requireSession, run],
  );

  const toMarkdownAction = useCallback(
    async (documentId: string) => {
      const { client: c, session: s } = requireSession();
      await run(async () => {
        const response = await docToMarkdown(c, s.sessionToken, documentId);
        setMarkdown(response.data);
      });
    },
    [requireSession, run],
  );

  const reset = useCallback(() => {
    setDocuments([]);
    setDocument(null);
    setMarkdown(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    create,
    upload,
    list,
    get,
    update,
    remove,
    toMarkdown: toMarkdownAction,
    documents,
    document,
    markdown,
    loading,
    error,
    reset,
  };
}
