export function supportsWebGL(documentRef: Pick<Document, "createElement"> = document) {
  try {
    const canvas = documentRef.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) return false;

    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
