/**
 * lib/cloudant.ts
 *
 * IBM Cloudant NoSQL — persistence layer.
 *
 * Auto-creates the "stories" database on first use if it does not exist.
 * Also creates a Mango query index for efficient per-user queries.
 *
 * Required env vars:
 *  CLOUDANT_URL      — e.g. https://<instance>.cloudantnosqldb.appdomain.cloud
 *  CLOUDANT_API_KEY  — IBM IAM API key (not the legacy legacy-credentials password)
 */

import { CloudantV1, IamAuthenticator } from '@ibm-cloud/cloudant';
import { Story } from '@/types';

const DB_NAME = 'stories';

// ─── Singleton client ─────────────────────────────────────────────────────────

let _client: CloudantV1 | null = null;

function getClient(): CloudantV1 {
  if (_client) return _client;

  const url = process.env.CLOUDANT_URL;
  const apiKey = process.env.CLOUDANT_API_KEY;

  if (!url) throw new Error('CLOUDANT_URL environment variable is not set.');
  if (!apiKey) throw new Error('CLOUDANT_API_KEY environment variable is not set.');

  _client = new CloudantV1({
    authenticator: new IamAuthenticator({ apikey: apiKey }),
    serviceUrl: url,
  });

  return _client;
}

// ─── DB bootstrap (runs once per server process) ─────────────────────────────

let _dbReady = false;
let _dbInitPromise: Promise<void> | null = null;

/**
 * Ensures the "stories" database exists and that a userId+createdAt index
 * is available for Mango queries.
 *
 * Called internally before every Cloudant operation.
 */
async function ensureDatabase(): Promise<void> {
  if (_dbReady) return;

  // If initialization is in progress, wait for it to complete
  if (_dbInitPromise) {
    await _dbInitPromise;
    if (_dbReady) return;
  }

  // Start initialization (only one will run at a time)
  _dbInitPromise = _initDatabase();
  await _dbInitPromise;
  _dbInitPromise = null;
}

async function _initDatabase(): Promise<void> {
  const client = getClient();

  // ── 1. Create DB if it does not exist ────────────────────────────────────
  try {
    await client.getDatabaseInformation({ db: DB_NAME });
    console.log(`[Cloudant] Database "${DB_NAME}" already exists.`);
  } catch (err: unknown) {
    const status =
      (err as { status?: number })?.status ??
      (err as { code?: number })?.code ??
      0;

    if (status === 404) {
      await client.putDatabase({ db: DB_NAME });
      console.log(`[Cloudant] Database "${DB_NAME}" created successfully.`);
    } else {
      throw new Error(
        `Cloudant connection error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // ── 2. Create Mango index for userId + createdAt ──────────────────────────
  // Allows efficient per-user story listing sorted by creation date.
  try {
    await client.postIndex({
      db: DB_NAME,
      index: { fields: ['userId', 'createdAt'] },
      name: 'userId-createdAt-idx',
      type: 'json',
    });
    console.log('[Cloudant] Index "userId-createdAt-idx" ensured.');
  } catch {
    // The index may already exist — safe to ignore this error.
  }

  _dbReady = true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Saves a new story document to Cloudant.
 * Returns the generated document { id, rev }.
 */
export async function saveStory(
  story: Omit<Story, '_id' | '_rev'>
): Promise<{ id: string; rev: string }> {
  await ensureDatabase();
  const client = getClient();

  const response = await client.postDocument({
    db: DB_NAME,
    document: {
      ...story,
      type: 'story', // used as a selector in Mango queries
    },
  });

  if (!response.result.ok) {
    throw new Error('Cloudant did not confirm the document save (ok=false).');
  }

  return {
    id: response.result.id!,
    rev: response.result.rev!,
  };
}

/**
 * Returns all stories belonging to a user, sorted newest-first.
 * Limits to 100 documents per call.
 */
export async function listStoriesByUser(userId: string): Promise<Story[]> {
  await ensureDatabase();
  const client = getClient();

  const response = await client.postFind({
    db: DB_NAME,
    selector: {
      type: { $eq: 'story' },
      userId: { $eq: userId },
    },
    // Sort requires the index to cover the field; use createdAt desc
    sort: [{ createdAt: 'desc' }],
    limit: 100,
  });

  return response.result.docs as Story[];
}

/**
 * Fetches a single story document by its Cloudant _id.
 */
export async function getStoryById(docId: string): Promise<Story> {
  await ensureDatabase();
  const client = getClient();

  const response = await client.getDocument({ db: DB_NAME, docId });
  return response.result as Story;
}

/**
 * Deletes a story document by _id and _rev.
 */
export async function deleteStory(docId: string, rev: string): Promise<void> {
  await ensureDatabase();
  const client = getClient();

  await client.deleteDocument({ db: DB_NAME, docId, rev });
}
