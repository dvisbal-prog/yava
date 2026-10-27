import { Platform } from "react-native";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { supabase } from "@/lib/supabase";

/**
 * Lee un archivo local como ArrayBuffer. En web el selector devuelve URIs blob:/data:, que
 * expo-file-system no puede abrir: ahí se lee con fetch. En iOS/Android se usa expo-file-system.
 */
export async function readLocalFile(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    if (!res.ok) throw new Error("No se pudo leer el archivo seleccionado.");
    return res.arrayBuffer();
  }
  const file = new File(uri);
  return file.arrayBuffer();
}

function contentTypeFor(uri: string, fallback = "image/jpeg"): string {
  // data:image/png;base64,... (web)
  const dataMime = /^data:([^;,]+)[;,]/i.exec(uri);
  if (dataMime) return dataMime[1].toLowerCase();
  const lower = uri.toLowerCase().split("?")[0];
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return fallback;
}

/**
 * Sube un archivo local a Storage. Lanza error si falla (el llamador decide reintentar).
 * Devuelve la ruta guardada.
 */
export async function uploadLocalFile(bucket: string, path: string, uri: string, contentType?: string): Promise<string> {
  let body: ArrayBuffer;
  let type = contentType;
  if (Platform.OS === "web") {
    // En web el blob trae su tipo real (las URIs blob: no tienen extensión).
    const res = await fetch(uri);
    if (!res.ok) throw new Error("No se pudo leer el archivo seleccionado.");
    const blob = await res.blob();
    body = await blob.arrayBuffer();
    type = type ?? (blob.type || undefined);
  } else {
    body = await readLocalFile(uri);
  }
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: type ?? contentTypeFor(uri), upsert: true });
  if (error) throw error;
  return path;
}

/** Compresión estándar de fotos de producto: máx. 1600 px, JPEG 0.8. */
export async function compressProductPhoto(uri: string, width: number, height: number): Promise<string> {
  const maxSide = Math.max(width, height);
  const ctx = ImageManipulator.manipulate(uri);
  if (maxSide > 1600) {
    const scale = 1600 / maxSide;
    ctx.resize({ width: Math.round(width * scale), height: Math.round(height * scale) });
  }
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  img.release();
  return out.uri;
}

/** Rota una imagen local (grados en sentido horario) y devuelve la nueva URI con dimensiones. */
export async function rotatePhoto(uri: string, degrees: number): Promise<{ uri: string; width: number; height: number }> {
  const img = await ImageManipulator.manipulate(uri).rotate(degrees).renderAsync();
  const out = await img.saveAsync({ compress: 0.95, format: SaveFormat.JPEG });
  img.release();
  return { uri: out.uri, width: out.width, height: out.height };
}

/** Recorta al cuadrado 1:1 centrado. */
export async function cropSquare(uri: string, width: number, height: number): Promise<{ uri: string; width: number; height: number }> {
  const side = Math.min(width, height);
  const originX = Math.floor((width - side) / 2);
  const originY = Math.floor((height - side) / 2);
  const img = await ImageManipulator.manipulate(uri).crop({ originX, originY, width: side, height: side }).renderAsync();
  const out = await img.saveAsync({ compress: 0.95, format: SaveFormat.JPEG });
  img.release();
  return { uri: out.uri, width: out.width, height: out.height };
}

/** URL firmada para un documento privado (1 hora). */
export async function signedDocumentUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
