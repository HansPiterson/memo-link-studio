import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
        const oEmbedUrl = `https://graph.facebook.com/v12.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=`;
        // Note: Instagram oEmbed doesn't require token for public posts
        const oEmbedResponse = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`);
        
        if (oEmbedResponse.ok) {
          const data = await oEmbedResponse.json();
          return new Response(
            JSON.stringify({
              title: data.title || data.author_name || null,
              thumbnail_url: data.thumbnail_url || null,
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

    return new Response(
      JSON.stringify({
        title: ogTitle,
        thumbnail_url: thumbnail_url,
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
