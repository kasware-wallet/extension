import log from 'loglevel';
export async function getJson(jsonUrl: string): Promise<any | undefined> {
  try {
    const response = await fetch(jsonUrl);
    const data = await response.json();
    return data;
  } catch (e) {
    log.error(e);
    // return undefined;
    throw new Error('Network response issue: ' + (e as Error).message);
  }
}

export async function getBase64JSON(jsonUrl: string): Promise<any | undefined> {
  try {
    const response = await fetch(jsonUrl);
    const data = await response.json();
    const content = data.content;
    const decoded = Buffer.from(content, 'base64');
    const str = decoded.toString();
    return JSON.parse(str);
  } catch (e) {
    log.error(e);
    // return undefined;
    throw new Error('Network response issue: ' + (e as Error).message);
  }
}
