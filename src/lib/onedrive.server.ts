// Server-only helpers for reading the business OneDrive folder through the
// Lovable connector gateway. Never import this from client code.

const GATEWAY_BASE = "https://connector-gateway.lovable.dev/microsoft_onedrive";

/** Folder holding the costume photos (lives in the shared costume drive). */
export const ROOT_FOLDER = "Original_photos";

function headers() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["MICROSOFT_ONEDRIVE_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("OneDrive is not connected for this project.");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
  };
}

export async function graphFetch(path: string, init?: RequestInit) {
  // Graph paging links are absolute; route them back through the gateway.
  const url = path.startsWith("http")
    ? path.replace("https://graph.microsoft.com/v1.0", GATEWAY_BASE)
    : `${GATEWAY_BASE}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: { ...headers(), ...(init?.headers ?? {}) },
    redirect: "follow",
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[OneDrive] ${res.status} ${url}: ${body}`);
    throw new Error(`OneDrive request failed [${res.status}]: ${body}`);
  }
  return res;
}

async function graphJson<T>(path: string): Promise<T> {
  return (await graphFetch(path)).json() as Promise<T>;
}

type DriveItem = {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { mimeType?: string };
};

type ChildrenResponse = { value: DriveItem[]; "@odata.nextLink"?: string };

type FolderItem = { id: string; parentReference?: { driveId?: string } };

let cachedRoot: { driveId: string; itemId: string } | null = null;

type SharedItem = {
  name: string;
  remoteItem?: { id: string; parentReference?: { driveId?: string } };
};

/** Resolve the photo folder, in the account's own drive or a shared drive. */
export async function resolveShareRoot() {
  if (cachedRoot) return cachedRoot;

  try {
    const item = await graphJson<FolderItem>(
      `/me/drive/root:/${encodeURIComponent(ROOT_FOLDER)}?$select=id,name,parentReference`,
    );
    const driveId = item.parentReference?.driveId;
    if (driveId) {
      cachedRoot = { driveId, itemId: item.id };
      return cachedRoot;
    }
  } catch {
    // fall through to the shared-with-me drives below
  }

  const shared = await graphJson<{ value: SharedItem[] }>("/me/drive/sharedWithMe");
  for (const entry of shared.value) {
    const remote = entry.remoteItem;
    const driveId = remote?.parentReference?.driveId;
    if (!remote || !driveId) continue;
    if (entry.name === ROOT_FOLDER) {
      cachedRoot = { driveId, itemId: remote.id };
      return cachedRoot;
    }
    const children = await listChildren(driveId, remote.id);
    const match = children.find((c) => c.folder && c.name === ROOT_FOLDER);
    if (match) {
      cachedRoot = { driveId, itemId: match.id };
      return cachedRoot;
    }
  }
  throw new Error("Could not resolve the OneDrive folder.");
}

async function listChildren(driveId: string, itemId: string): Promise<DriveItem[]> {
  const out: DriveItem[] = [];
  let next: string | undefined =
    `/drives/${driveId}/items/${itemId}/children?$select=id,name,folder,file&$top=200`;
  while (next) {
    const page: ChildrenResponse = await graphJson<ChildrenResponse>(next);
    out.push(...page.value);
    next = page["@odata.nextLink"];
  }
  return out;
}

export type OneDrivePhoto = {
  id: string;
  name: string;
  /** Folder/file path used for auto-tagging, e.g. "Red/[Red]_IMG_1234.jpg". */
  path: string;
  category: string;
  colors: string[];
};

const IMAGE_RE = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i;
/** Camera-generated names like 20230303_083130000_iOS.jpg carry no meaning. */
const CAMERA_RE = /^(img|dsc|photo|\d{8})[\s_-]?\d*/i;

/** Folder names in OneDrive use US spellings; the catalogue uses UK ones. */
const COLOR_ALIASES: Record<string, string> = {
  Gray: "Grey",
  Multicolor: "Multicolour",
};

export function normalizeColor(folder: string) {
  const name = folder.trim();
  const mapped = COLOR_ALIASES[name] ?? name;
  return mapped.toLowerCase() === "untagged" ? "" : mapped;
}

function prettyName(fileName: string, folder: string, index: number) {
  const base = fileName
    .replace(IMAGE_RE, "")
    .replace(/^\[[^\]]*\]_?/, "") // strip the "[Colour]_" tag prefix
    .replace(/[_]+/g, " ")
    .trim();
  if (!base || CAMERA_RE.test(base)) {
    return folder ? `${folder} ${index}` : `Costume ${index}`;
  }
  return base.replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * Walk the photo folder (root + up to two levels of subfolders) and return
 * every image file found, with its folder used as the category/colour.
 */
export async function listCostumePhotos(maxItems = 5000): Promise<OneDrivePhoto[]> {
  const { driveId, itemId } = await resolveShareRoot();
  const photos: OneDrivePhoto[] = [];

  const KNOWN_COLORS = new Set(
    [
      "black","blue","brown","green","grey","gray","multicolor","multicolour",
      "orange","pink","purple","red","white","yellow","gold","silver","beige","cream",
    ],
  );

  const collect = (items: DriveItem[], folderName: string) => {
    let index = 1;
    for (const item of items) {
      if (item.folder || !IMAGE_RE.test(item.name)) continue;
      if (photos.length >= maxItems) return;
      const top = folderName ? (folderName.split(" / ")[0] as string) : "Other";
      const color = KNOWN_COLORS.has(top.toLowerCase()) ? normalizeColor(top) : "";
      photos.push({
        id: item.id,
        name: prettyName(item.name, top, index++),
        path: folderName ? `${folderName}/${item.name}` : item.name,
        category: top,
        colors: color ? [color] : [],
      });
    }
  };

  const rootItems = await listChildren(driveId, itemId);
  collect(rootItems, "");

  const folders = rootItems.filter((i) => i.folder && !i.name.startsWith("."));
  for (const folder of folders) {
    if (photos.length >= maxItems) break;
    const children = await listChildren(driveId, folder.id);
    collect(children, folder.name);

    for (const sub of children.filter((c) => c.folder && !c.name.startsWith("."))) {
      if (photos.length >= maxItems) break;
      const subChildren = await listChildren(driveId, sub.id);
      collect(subChildren, `${folder.name} / ${sub.name}`);
    }
  }

  return photos;
}

/**
 * Stream a costume photo. Uses the large Graph thumbnail (always JPEG), so
 * iPhone HEIC originals still render in the browser.
 */
export async function fetchImage(itemId: string) {
  const { driveId } = await resolveShareRoot();
  const base = `/drives/${driveId}/items/${encodeURIComponent(itemId)}`;
  try {
    return await graphFetch(`${base}/thumbnails/0/large/content`);
  } catch {
    return graphFetch(`${base}/content`);
  }
}

/**
 * Stream a costume photo addressed by its folder/file path inside the photo
 * folder. Item ids change over time, so path addressing is the stable way to
 * reach a photo.
 */
export async function fetchImageByPath(sourcePath: string) {
  const { driveId, itemId } = await resolveShareRoot();
  // Stored paths use " / " between nested folders.
  const clean = sourcePath
    .split(/\s*\/\s*/)
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const base = `/drives/${driveId}/items/${itemId}:/${clean}:`;
  try {
    return await graphFetch(`${base}/thumbnails/0/large/content`);
  } catch {
    return graphFetch(`${base}/content`);
  }
}
