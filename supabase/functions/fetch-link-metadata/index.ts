import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#64;': '@',
    '&#x2F;': '/',
  };
  
  let decoded = text;
  
  // Replace named entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replaceAll(entity, char);
  }
  
  // Replace numeric entities (decimal)
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => 
    String.fromCodePoint(parseInt(dec, 10))
  );
  
  // Replace numeric entities (hex)
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => 
    String.fromCodePoint(parseInt(hex, 16))
  );
  
  return decoded;
}

// Function to parse Instagram title
function parseInstagramTitle(title: string): { author: string; caption: string } {
  // Decode HTML entities first
  const decoded = decodeHtmlEntities(title);
  
  // Pattern: "username on Instagram: "caption""
  const match = decoded.match(/^(.+?)\s+on\s+Instagram:\s*[""](.+?)[""]?$/i);
  
  if (match) {
    return {
      author: match[1].trim(),
      caption: match[2].trim(),
    };
  }
  
  // Fallback: use the full decoded title
  return {
    author: "",
    caption: decoded,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching metadata for:", url);

    // Try Instagram oEmbed API first
    if (url.includes("instagram.com")) {
      try {
        const oEmbedResponse = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`);
        
        if (oEmbedResponse.ok) {
          const data = await oEmbedResponse.json();
          const rawTitle = data.title || data.author_name || null;
          const rawThumbnail = data.thumbnail_url || null;
          
          // Parse and decode Instagram title
          let parsedTitle = rawTitle;
          if (rawTitle && rawTitle.includes("on Instagram:")) {
            const parsed = parseInstagramTitle(rawTitle);
            parsedTitle = parsed.author ? `${parsed.author}: ${parsed.caption}` : parsed.caption;
          } else if (rawTitle) {
            parsedTitle = decodeHtmlEntities(rawTitle);
          }
          
          return new Response(
            JSON.stringify({
              title: parsedTitle,
              thumbnail_url: rawThumbnail ? decodeHtmlEntities(rawThumbnail) : null,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.log("Instagram oEmbed failed, falling back to meta scraping:", e);
      }
    }

    // Fallback: Fetch HTML and parse meta tags
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkKeeper/1.0; +https://linkkeeper.app)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract Open Graph image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const ogImage = ogImageMatch ? ogImageMatch[1] : null;

    // Extract Open Graph title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1] : null;

    // Extract Twitter card image as fallback
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    const twitterImage = twitterImageMatch ? twitterImageMatch[1] : null;

    const thumbnail_url = ogImage || twitterImage;

    // Decode HTML entities in the results
    let finalTitle = ogTitle ? decodeHtmlEntities(ogTitle) : null;
    let finalThumbnail = thumbnail_url ? decodeHtmlEntities(thumbnail_url) : null;
    
    // Parse Instagram title if detected
    if (finalTitle && url.includes("instagram.com") && finalTitle.includes("on Instagram:")) {
      const parsed = parseInstagramTitle(finalTitle);
      finalTitle = parsed.author ? `${parsed.author}: ${parsed.caption}` : parsed.caption;
    }

    return new Response(
      JSON.stringify({
        title: finalTitle,
        thumbnail_url: finalThumbnail,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error fetching metadata:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        title: null,
        thumbnail_url: null 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
