import * as cheerio from "cheerio";
import { CONFIG } from "../utils/config.ts";

export async function fetchWithTimeout(
  url: string,
  timeoutMs: number = CONFIG.SCRAPE_TIMEOUT_MS
): Promise<string | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    clearTimeout(id);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    clearTimeout(id);
    return null;
  }
}

export function cleanHtmlText(html: string, maxLength = 4500): string {
  const $ = cheerio.load(html);
  $("script, style, iframe, nav, footer, header, form, svg, noscript, aside, .advertisement").remove();
  return $("body").text().replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function searchDuckDuckGo(query: string, maxResults = CONFIG.MAX_SEARCH_URLS): Promise<string[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const html = await fetchWithTimeout(url, CONFIG.SEARCH_TIMEOUT_MS);
    if (!html) return [];

    const $ = cheerio.load(html);
    const urls: string[] = [];

    $(".result__url").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      let actualUrl = href;
      if (href.includes("uddg=")) {
        const match = href.match(/uddg=([^&]+)/);
        if (match?.[1]) actualUrl = decodeURIComponent(match[1]);
      }

      const lower = actualUrl.toLowerCase();
      const excluded = ["linkedin", "facebook", "twitter", "x.com", "quora", "wikipedia", "youtube", "reddit", "pinterest", "instagram"];
      const academic = [".ac.in", ".edu", ".res.in", "scholar.google", "arxiv.org", "dblp", "faculty", "professor", "people", "dept", "research", "lab"];

      if (excluded.some((e) => lower.includes(e))) return;
      if (academic.some((a) => lower.includes(a))) {
        urls.push(actualUrl);
      }
    });

    return [...new Set(urls)].slice(0, maxResults);
  } catch (err) {
    console.error(`DuckDuckGo search error for "${query}":`, err);
    return [];
  }
}

export async function fetchPageText(url: string): Promise<{ url: string; text: string; title: string } | null> {
  try {
    const html = await fetchWithTimeout(url, CONFIG.SCRAPE_TIMEOUT_MS);
    if (!html) return null;
    const text = cleanHtmlText(html, 4000);
    if (text.length < 120) return null;
    const $ = cheerio.load(html);
    const title = $("title").text().trim() || url;
    return { url, text, title };
  } catch {
    return null;
  }
}
