import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOWNLOAD_DELAY_MS = 3000; // 3 second delay between downloads

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractInstagramImages(url: string): Promise<string[]> {
  try {
    console.log("Fetching Instagram post:", url);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram post: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract image URLs from meta tags
    const imageUrls: string[] = [];
    
    // Try og:image first
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      imageUrls.push(ogImageMatch[1]);
    }
    
    // Look for additional images in the HTML (carousel posts)
    const displayUrlMatches = html.matchAll(/"display_url":"([^"]+)"/g);
    for (const match of displayUrlMatches) {
      const imageUrl = match[1].replace(/\\u0026/g, '&');
      if (!imageUrls.includes(imageUrl)) {
        imageUrls.push(imageUrl);
      }
    }
    
    console.log(`Found ${imageUrls.length} images in post`);
    return imageUrls;
    
  } catch (error) {
    console.error("Error extracting Instagram images:", error);
    throw error;
  }
}

async function downloadAndUploadImage(
  imageUrl: string,
  userId: string,
  linkId: string,
  imageIndex: number,
  supabaseClient: any
): Promise<{ storage_path: string; image_url: string }> {
  try {
    console.log(`Downloading image ${imageIndex + 1}:`, imageUrl);
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Generate storage path
    const timestamp = Date.now();
    const filename = `${linkId}_${imageIndex}_${timestamp}.jpg`;
    const storagePath = `${userId}/${filename}`;
    
    console.log("Uploading to storage:", storagePath);
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from('gallery-images')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('gallery-images')
      .getPublicUrl(storagePath);
    
    console.log("Image uploaded successfully:", publicUrl);
    
    return {
      storage_path: storagePath,
      image_url: publicUrl
    };
    
  } catch (error) {
    console.error(`Error downloading/uploading image ${imageIndex + 1}:`, error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { url, linkId } = await req.json();
    
    if (!url || !linkId) {
      return new Response(
        JSON.stringify({ error: "URL and linkId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if URL is Instagram image post (not reel)
    if (!url.includes("instagram.com/p/")) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Not an Instagram image post",
          downloaded: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing Instagram image post:", url);

    // Extract all images from the post
    const imageUrls = await extractInstagramImages(url);
    
    if (imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No images found",
          downloaded: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const downloadedImages = [];
    
    // Download and upload each image with delay
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const { storage_path, image_url } = await downloadAndUploadImage(
          imageUrls[i],
          user.id,
          linkId,
          i,
          supabaseClient
        );
        
        // Save to database
        const { error: dbError } = await supabaseClient
          .from('gallery_images')
          .insert({
            user_id: user.id,
            link_id: linkId,
            image_url: image_url,
            storage_path: storage_path,
            instagram_post_url: url,
            image_index: i
          });
        
        if (dbError) {
          console.error("Database error:", dbError);
        } else {
          downloadedImages.push({ image_url, image_index: i });
        }
        
        // Add delay between downloads (except for the last one)
        if (i < imageUrls.length - 1) {
          console.log(`Waiting ${DOWNLOAD_DELAY_MS}ms before next download...`);
          await delay(DOWNLOAD_DELAY_MS);
        }
        
      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error);
        // Continue with next image even if one fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Downloaded ${downloadedImages.length} of ${imageUrls.length} images`,
        downloaded: downloadedImages.length,
        total: imageUrls.length,
        images: downloadedImages
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in download-instagram-images function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        downloaded: 0
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
