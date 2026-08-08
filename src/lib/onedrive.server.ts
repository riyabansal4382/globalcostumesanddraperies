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
  folder?: { childCount: number };
  file?: { mimeType?: string };
};

type ChildrenResponse = { value: DriveItem[]; "@odata.nextLink"?: string };

type ShareRoot = { id: string; parentReference?: { driveId?: string } };

/** The shared folder lives in the owner's drive, so resolve its drive id once. */
export async function resolveShareRoot() {
  const root = await graphJson<ShareRoot>(
    `/shares/${encodeShareId(SHARE_URL)}/driveItem?$select=id,name,parentReference`,
  );
  const driveId = root.parentReference?.driveId;
  if (!driveId) throw new Error("Could not resolve the OneDrive folder.");
  return { driveId, itemId: root.id };
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
  /** Folder/file path used for auto-tagging, e.g. "Angarakha/Red kurta.jpg". */
  path: string;
  category: string;
};

const IMAGE_RE = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i;
/** Camera-generated names like 20230303_083130000_iOS.jpg carry no meaning. */
const CAMERA_RE = /^(img|dsc|photo|\d{8})[\s_-]?\d*/i;

function prettyName(fileName: string, folder: string, index: number) {
  const base = fileName.replace(IMAGE_RE, "").replace(/[_]+/g, " ").trim();
  if (!base || CAMERA_RE.test(base)) {
    return folder ? `${folder} ${index}` : `Costume ${index}`;
  }
  return base.replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * Walk the shared folder (root + up to two levels of subfolders) and return
 * every image file found, with its folder used as the category.
 */
export async function listCostumePhotos(maxItems = 3000): Promise<OneDrivePhoto[]> {
  const { driveId, itemId } = await resolveShareRoot();
  const photos: OneDrivePhoto[] = [];

  const collect = (items: DriveItem[], folderName: string) => {
    let index = 1;
    for (const item of items) {
      if (item.folder || !IMAGE_RE.test(item.name)) continue;
      if (photos.length >= maxItems) return;
      photos.push({
        id: item.id,
        name: prettyName(item.name, folderName, index++),
        path: folderName ? `${folderName}/${item.name}` : item.name,
        category: folderName ? (folderName.split(" / ")[0] as string) : "Other",
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
