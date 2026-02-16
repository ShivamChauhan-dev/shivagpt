type WebSearchResult = {
  title: string;
  snippet: string;
  url: string;
};

type DuckDuckGoTopic = {
  FirstURL?: string;
  Text?: string;
  Topics?: DuckDuckGoTopic[];
};

function flattenTopics(topics: DuckDuckGoTopic[] = []): DuckDuckGoTopic[] {
  const output: DuckDuckGoTopic[] = [];

  for (const topic of topics) {
    if (Array.isArray(topic.Topics) && topic.Topics.length > 0) {
      output.push(...flattenTopics(topic.Topics));
    } else {
      output.push(topic);
    }
  }

  return output;
}

export async function searchWeb(
  query: string,
  limit = 5,
): Promise<WebSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const url = new URL("https://api.duckduckgo.com/");
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "json");
    url.searchParams.set("no_html", "1");
    url.searchParams.set("skip_disambig", "1");
    url.searchParams.set("no_redirect", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      AbstractText?: string;
      AbstractURL?: string;
      Heading?: string;
      RelatedTopics?: DuckDuckGoTopic[];
    };

    const results: WebSearchResult[] = [];

    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading || "Result",
        snippet: data.AbstractText,
        url: data.AbstractURL,
      });
    }

    const related = flattenTopics(data.RelatedTopics ?? []);
    for (const topic of related) {
      if (results.length >= limit) {
        break;
      }

      if (!topic.Text || !topic.FirstURL) {
        continue;
      }

      const splitIndex = topic.Text.indexOf(" - ");
      const title =
        splitIndex > -1 ? topic.Text.slice(0, splitIndex) : "Result";
      const snippet =
        splitIndex > -1 ? topic.Text.slice(splitIndex + 3).trim() : topic.Text;

      results.push({
        title: title.trim() || "Result",
        snippet: snippet.trim(),
        url: topic.FirstURL,
      });
    }

    return results.slice(0, limit);
  } catch {
    return [];
  }
}
