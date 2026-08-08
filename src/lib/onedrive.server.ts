// Server-only helpers for reading the business OneDrive folder through the
// Lovable connector gateway. Never import this from client code.

const GATEWAY_BASE = "https://connector-gateway.lovable.dev/microsoft_onedrive/v1.0";

/** The shared costume-photo folder, encoded as a Graph share id. */
export const SHARE_URL =
  "https://1drv.ms/f/c/c6d9552d27b012a2/IgCiErAnLVXZIIDGUQEAAAAAAcoZcOa4OzDHph9qaXyit68";

export function encodeShareId(url: string) {
  const b64 = Buffer.from(url, "utf8").toString("base64");
  return `u!${b64.replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-")}`;
}

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
  const url = path.startsWith("http") ? path : `${GATEWAY_BASE}${path}`;
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
  size?: number;
  folder?: { childCount: number };
  file?: { mimeType?: string };
};

type ChildrenResponse = { value: DriveItem[]; "@odata.nextLink"?: string };

async function listChildren(itemPath: string): Promise<DriveItem[]> {
  const out: DriveItem[] = [];
  let next: string | undefined =
    `${itemPath}/children?$select=id,name,folder,file,size&$top=200`;
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
  /** Folder/file path used for auto-tagging, e.g. "Angarakha/Red kurta.jpg". */
  path: string;
  category: string;
};

const IMAGE_RE = /\.(jpe?g|png|webp|gif|heic|avif)$/i;

/**
 * Walk the shared folder (root + subfolders, two levels deep) and return
 * every image file found, with its folder used as the category.
 */
export async function listCostumePhotos(maxItems = 2000): Promise<OneDrivePhoto[]> {
  const shareRoot = `/shares/${encodeShareId(SHARE_URL)}/driveItem`;
  const photos: OneDrivePhoto[] = [];

  const collect = (items: DriveItem[], folderName: string) => {
    for (const item of items) {
      if (item.folder || !IMAGE_RE.test(item.name)) continue;
      if (photos.length >= maxItems) return;
      photos.push({
        id: item.id,
        name: item.name.replace(IMAGE_RE, "").replace(/[_]+/g, " ").trim(),
        path: folderName ? `${folderName}/${item.name}` : item.name,
        category: folderName || "Other",
      });
    }
  };

  const rootItems = await listChildren(shareRoot);
  collect(rootItems, "");

  const folders = rootItems.filter((i) => i.folder && !i.name.startsWith("."));
  for (const folder of folders) {
    if (photos.length >= maxItems) break;
    const children = await listChildren(`/me/drive/items/${folder.id}`);
    collect(children, folder.name);

    // one more level (e.g. Category/Subcategory/photo.jpg)
    for (const sub of children.filter((c) => c.folder && !c.name.startsWith("."))) {
      if (photos.length >= maxItems) break;
      const subChildren = await listChildren(`/me/drive/items/${sub.id}`);
      collect(subChildren, `${folder.name} / ${sub.name}`);
    }
  }

  return photos;
}

/** Stream a OneDrive image back to the browser. */
export async function fetchImage(itemId: string) {
  return graphFetch(`/me/drive/items/${encodeURIComponent(itemId)}/content`);
}
