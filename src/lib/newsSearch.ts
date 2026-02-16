type NewsItem = {
  title: string;
  link: string;
  publishedAt: string;
  source: string;
};

function decodeXml(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractTag(block: string, tag: string) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const match = block.match(regex);
  if (!match) return "";
  return decodeXml(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
}

function extractSource(title: string) {
  const parts = title.split(" - ");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].trim();
}

export async function searchLatestNews(
  query: string,
  limit = 6,
): Promise<NewsItem[]> {
  const q = query.trim() || "latest news";
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", q);
  url.searchParams.set("hl", "en-IN");
  url.searchParams.set("gl", "IN");
  url.searchParams.set("ceid", "IN:en");

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

    const items = itemBlocks
      .slice(0, limit)
      .map((block) => {
        const title = extractTag(block, "title");
        const link = extractTag(block, "link");
        const publishedAt = extractTag(block, "pubDate");

        return {
          title,
          link,
          publishedAt,
          source: extractSource(title),
        };
      })
      .filter((item) => item.title && item.link);

    return items;
  } catch {
    return [];
  }
}
